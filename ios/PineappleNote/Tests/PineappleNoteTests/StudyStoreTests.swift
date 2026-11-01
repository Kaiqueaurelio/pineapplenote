import XCTest
@testable import PineappleNote

final class StudyStoreTests: XCTestCase {
    private static func makeDefaults() -> UserDefaults {
        let suiteName = "PineappleNoteTests.\(UUID().uuidString)"
        return UserDefaults(suiteName: suiteName)!
    }

    func testDeletingAllWelcomeNotesStaysEmptyAfterReopeningStore() async {
        await MainActor.run {
            let defaults = Self.makeDefaults()
            let firstStore = StudyStore(defaults: defaults)
            XCTAssertFalse(firstStore.notes.isEmpty)

            for note in firstStore.notes {
                firstStore.delete(note)
            }
            XCTAssertTrue(firstStore.notes.isEmpty)

            let reopenedStore = StudyStore(defaults: defaults)
            XCTAssertTrue(reopenedStore.notes.isEmpty)
        }
    }

    func testFlashcardReviewCountPersists() async {
        await MainActor.run {
            let defaults = makeDefaults()
            let store = StudyStore(defaults: defaults)
            let card = StudyFlashcard(question: "O que é Swift?", answer: "Uma linguagem.")
            store.save(card)
            store.markReviewed(card)

            let reopenedStore = StudyStore(defaults: defaults)
            XCTAssertEqual(reopenedStore.flashcards.first?.id, card.id)
            XCTAssertEqual(reopenedStore.flashcards.first?.reviewCount, 1)
            XCTAssertNotNil(reopenedStore.flashcards.first?.lastReviewedAt)
        }
    }

    func testQuizAttemptsAreRestoredAndPersistedByBackup() async throws {
        try await MainActor.run {
            let source = StudyStore(defaults: Self.makeDefaults())
            source.recordQuizAttempt(totalQuestions: 10, correctAnswers: 8, subject: "Biologia")
            let backup = try source.makeBackupData()

            let destinationDefaults = Self.makeDefaults()
            let destination = StudyStore(defaults: destinationDefaults)
            try destination.restoreBackup(from: backup)

            XCTAssertEqual(destination.quizAttempts.count, 1)
            XCTAssertEqual(destination.quizAttempts.first?.percentage, 80)

            let reopenedDestination = StudyStore(defaults: destinationDefaults)
            XCTAssertEqual(reopenedDestination.quizAttempts.count, 1)
            XCTAssertEqual(reopenedDestination.quizAttempts.first?.subject, "Biologia")
            XCTAssertEqual(reopenedDestination.quizAttempts.first?.correctAnswers, 8)
        }
    }

    func testBackupRestoreMergesWithoutDuplicatingExistingNotes() async throws {
        try await MainActor.run {
            let defaults = makeDefaults()
            let store = StudyStore(defaults: defaults)
            let note = StudyNote(title: "Cálculo", body: "Derivadas", subject: "Matemática")
            store.save(note)
            let backup = try store.makeBackupData()

            try store.restoreBackup(from: backup)

            XCTAssertEqual(store.notes.filter { $0.id == note.id }.count, 1)
            XCTAssertEqual(store.notes.first(where: { $0.id == note.id })?.body, "Derivadas")
        }
    }

    func testQuestionValidationRequiresFourNonEmptyOptionsAndValidAnswer() {
        let valid = StudyQuestion(
            prompt: "Quanto é 2 + 2?",
            options: ["3", "4", "5", "6"],
            correctOptionIndex: 1
        )
        let invalid = StudyQuestion(
            prompt: "Pergunta incompleta",
            options: ["A", "", "C", "D"],
            correctOptionIndex: 0
        )

        XCTAssertTrue(valid.hasValidAnswers)
        XCTAssertFalse(invalid.hasValidAnswers)
    }
}
