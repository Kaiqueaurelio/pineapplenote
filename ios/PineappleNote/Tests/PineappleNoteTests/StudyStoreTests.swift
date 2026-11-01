import XCTest
@testable import PineappleNote

private func makeStudyTestDefaults() -> UserDefaults {
    let suiteName = "PineappleNoteTests.\(UUID().uuidString)"
    return UserDefaults(suiteName: suiteName)!
}

final class StudyStoreTests: XCTestCase {

    func testDeletingAllWelcomeNotesStaysEmptyAfterReopeningStore() async {
        await MainActor.run {
            let defaults = makeStudyTestDefaults()
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
            let defaults = makeStudyTestDefaults()
            let store = StudyStore(defaults: defaults)
            let card = StudyFlashcard(question: "O que é Swift?", answer: "Uma linguagem.")
            store.save(card)
            store.markReviewed(card, remembered: true)

            let reopenedStore = StudyStore(defaults: defaults)
            XCTAssertEqual(reopenedStore.flashcards.first?.id, card.id)
            XCTAssertEqual(reopenedStore.flashcards.first?.reviewCount, 1)
            XCTAssertNotNil(reopenedStore.flashcards.first?.lastReviewedAt)
            XCTAssertEqual(reopenedStore.flashcards.first?.correctStreak, 1)
            XCTAssertNotNil(reopenedStore.flashcards.first?.nextReviewAt)
        }
    }


    func testForgottenFlashcardIsScheduledForQuickReview() async {
        await MainActor.run {
            let store = StudyStore(defaults: makeStudyTestDefaults())
            let card = StudyFlashcard(question: "Pergunta", answer: "Resposta")
            store.save(card)
            store.markReviewed(card, remembered: false)

            let reviewedCard = store.flashcards.first
            XCTAssertEqual(reviewedCard?.reviewCount, 1)
            XCTAssertEqual(reviewedCard?.correctStreak, 0)
            XCTAssertNotNil(reviewedCard?.nextReviewAt)
            if let nextReviewAt = reviewedCard?.nextReviewAt {
                let minutes = Calendar.current.dateComponents([.minute], from: .now, to: nextReviewAt).minute ?? 0
                XCTAssertTrue((9...10).contains(minutes))
            }
        }
    }

    func testQuizAttemptsAreRestoredAndPersistedByBackup() async throws {
        try await MainActor.run {
            let source = StudyStore(defaults: makeStudyTestDefaults())
            source.recordQuizAttempt(totalQuestions: 10, correctAnswers: 8, subject: "Biologia")
            let backup = try source.makeBackupData()

            let destinationDefaults = makeStudyTestDefaults()
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

    func testRestoringBackupOnFreshInstallDoesNotDuplicateWelcomeNotes() async throws {
        try await MainActor.run {
            let source = StudyStore(defaults: makeStudyTestDefaults())
            let backup = try source.makeBackupData()

            let destination = StudyStore(defaults: makeStudyTestDefaults())
            let originalWelcomeCount = destination.notes.count
            try destination.restoreBackup(from: backup)

            XCTAssertEqual(destination.notes.count, originalWelcomeCount)
            XCTAssertEqual(destination.notes.filter { $0.title == "Bem-vindo ao Pineapple!" }.count, 1)
            XCTAssertEqual(destination.notes.filter { $0.title == "Como estudar melhor" }.count, 1)
        }
    }

    func testBackupRestoreMergesWithoutDuplicatingExistingNotes() async throws {
        try await MainActor.run {
            let defaults = makeStudyTestDefaults()
            let store = StudyStore(defaults: defaults)
            let note = StudyNote(title: "Cálculo", body: "Derivadas", subject: "Matemática")
            store.save(note)
            let backup = try store.makeBackupData()

            try store.restoreBackup(from: backup)

            XCTAssertEqual(store.notes.filter { $0.id == note.id }.count, 1)
            XCTAssertEqual(store.notes.first(where: { $0.id == note.id })?.body, "Derivadas")
        }
    }

    func testWebLinksAreSavedAndIncludedInBackupsWithoutDuplicates() async throws {
        try await MainActor.run {
            let source = StudyStore(defaults: makeStudyTestDefaults())
            let url = URL(string: "https://example.com/aula")!
            try source.addWebLink(url, displayName: "Aula de exemplo")
            XCTAssertEqual(source.materials.count, 1)
            XCTAssertEqual(source.materials.first?.kind, .link)

            let backup = try source.makeBackupData()
            let destinationDefaults = makeStudyTestDefaults()
            let destination = StudyStore(defaults: destinationDefaults)
            try destination.addWebLink(url, displayName: "Aula existente")
            try destination.restoreBackup(from: backup)

            XCTAssertEqual(destination.materials.filter { $0.sourceURL == url.absoluteString }.count, 1)
            XCTAssertEqual(destination.materials.first?.name, "Aula de exemplo")

            let reopened = StudyStore(defaults: destinationDefaults)
            XCTAssertEqual(reopened.materials.first?.sourceURL, url.absoluteString)
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
