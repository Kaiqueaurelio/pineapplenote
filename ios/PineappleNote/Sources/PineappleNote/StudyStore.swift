import Foundation
import SwiftUI

@MainActor
final class StudyStore: ObservableObject {
    @Published private(set) var notes: [StudyNote]
    @Published private(set) var flashcards: [StudyFlashcard]
    @Published private(set) var questions: [StudyQuestion]

    private let defaults: UserDefaults
    private let notesKey = "pineapple.local-notes.v2"
    private let flashcardsKey = "pineapple.local-flashcards.v1"
    private let questionsKey = "pineapple.local-questions.v1"

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults

        let welcomeNotes = [
            StudyNote(
                title: "Bem-vindo ao Pineapple!",
                body: "Este é seu espaço de estudos. Crie sua primeira anotação, organize suas ideias e monte seus materiais de revisão.",
                subject: "Comece aqui"
            ),
            StudyNote(
                title: "Como estudar melhor",
                body: "• Divida assuntos grandes em pequenas partes.\n• Faça revisões espaçadas.\n• Explique o conteúdo com suas próprias palavras.",
                subject: "Métodos de estudo"
            )
        ]

        notes = Self.loadArray(forKey: notesKey, from: defaults, initial: welcomeNotes)
            .sorted { $0.updatedAt > $1.updatedAt }
        flashcards = Self.loadArray(forKey: flashcardsKey, from: defaults, initial: [])
            .sorted { $0.createdAt > $1.createdAt }
        questions = Self.loadArray(forKey: questionsKey, from: defaults, initial: [])
            .sorted { $0.createdAt > $1.createdAt }
    }

    func save(_ note: StudyNote) {
        var updated = note
        updated.updatedAt = .now
        if let index = notes.firstIndex(where: { $0.id == note.id }) {
            notes[index] = updated
        } else {
            notes.insert(updated, at: 0)
        }
        notes.sort { $0.updatedAt > $1.updatedAt }
        persist(notes, forKey: notesKey)
    }

    func delete(_ note: StudyNote) {
        notes.removeAll { $0.id == note.id }
        persist(notes, forKey: notesKey)
    }

    func save(_ flashcard: StudyFlashcard) {
        if let index = flashcards.firstIndex(where: { $0.id == flashcard.id }) {
            flashcards[index] = flashcard
        } else {
            flashcards.insert(flashcard, at: 0)
        }
        flashcards.sort { $0.createdAt > $1.createdAt }
        persist(flashcards, forKey: flashcardsKey)
    }

    func delete(_ flashcard: StudyFlashcard) {
        flashcards.removeAll { $0.id == flashcard.id }
        persist(flashcards, forKey: flashcardsKey)
    }

    func markReviewed(_ flashcard: StudyFlashcard) {
        guard let index = flashcards.firstIndex(where: { $0.id == flashcard.id }) else { return }
        flashcards[index].reviewCount += 1
        flashcards[index].lastReviewedAt = .now
        persist(flashcards, forKey: flashcardsKey)
    }

    func save(_ question: StudyQuestion) {
        if let index = questions.firstIndex(where: { $0.id == question.id }) {
            questions[index] = question
        } else {
            questions.insert(question, at: 0)
        }
        questions.sort { $0.createdAt > $1.createdAt }
        persist(questions, forKey: questionsKey)
    }

    func delete(_ question: StudyQuestion) {
        questions.removeAll { $0.id == question.id }
        persist(questions, forKey: questionsKey)
    }

    private static func loadArray<Element: Codable>(
        forKey key: String,
        from defaults: UserDefaults,
        initial: [Element]
    ) -> [Element] {
        guard let data = defaults.data(forKey: key) else {
            if let encoded = try? JSONEncoder().encode(initial) {
                defaults.set(encoded, forKey: key)
            }
            return initial
        }

        return (try? JSONDecoder().decode([Element].self, from: data)) ?? []
    }

    private func persist<Element: Codable>(_ values: [Element], forKey key: String) {
        guard let data = try? JSONEncoder().encode(values) else { return }
        defaults.set(data, forKey: key)
    }
}
