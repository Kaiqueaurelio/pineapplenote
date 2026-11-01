import Foundation
import SwiftUI
import UniformTypeIdentifiers

@MainActor
final class StudyStore: ObservableObject {
    @Published private(set) var notes: [StudyNote]
    @Published private(set) var flashcards: [StudyFlashcard]
    @Published private(set) var questions: [StudyQuestion]
    @Published private(set) var materials: [StudyMaterial]

    private let defaults: UserDefaults
    private let notesKey = "pineapple.local-notes.v2"
    private let legacyNotesKey = "pineapple.local-notes.v1"
    private let flashcardsKey = "pineapple.local-flashcards.v1"
    private let questionsKey = "pineapple.local-questions.v1"
    private let materialsKey = "pineapple.local-materials.v1"
    private let materialsFolder = "StudyMaterials"

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

        notes = Self.loadNotes(
            from: defaults,
            storageKey: notesKey,
            legacyKey: legacyNotesKey,
            initial: welcomeNotes
        ).sorted { $0.updatedAt > $1.updatedAt }

        flashcards = Self.loadArray(forKey: flashcardsKey, from: defaults, initial: [])
            .sorted { $0.createdAt > $1.createdAt }
        questions = Self.loadArray(forKey: questionsKey, from: defaults, initial: [])
            .sorted { $0.createdAt > $1.createdAt }
        materials = Self.loadArray(forKey: materialsKey, from: defaults, initial: [])
            .sorted { $0.importedAt > $1.importedAt }
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

    func importMaterial(from sourceURL: URL) throws {
        let didStartAccess = sourceURL.startAccessingSecurityScopedResource()
        defer {
            if didStartAccess {
                sourceURL.stopAccessingSecurityScopedResource()
            }
        }

        let fileManager = FileManager.default
        let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let folderURL = documentsURL.appendingPathComponent(materialsFolder, isDirectory: true)
        try fileManager.createDirectory(at: folderURL, withIntermediateDirectories: true)

        let fileExtension = sourceURL.pathExtension.lowercased()
        let destinationName = fileExtension.isEmpty
            ? UUID().uuidString
            : "\(UUID().uuidString).\(fileExtension)"
        let destinationURL = folderURL.appendingPathComponent(destinationName)
        try fileManager.copyItem(at: sourceURL, to: destinationURL)

        let attributes = try fileManager.attributesOfItem(atPath: destinationURL.path)
        let size = (attributes[.size] as? NSNumber)?.int64Value ?? 0
        let type = UTType(filenameExtension: fileExtension)
        let kind: StudyMaterialKind

        if type?.conforms(to: .pdf) == true {
            kind = .pdf
        } else if type?.conforms(to: .audio) == true {
            kind = .audio
        } else if type?.conforms(to: .movie) == true {
            kind = .video
        } else if type?.conforms(to: .image) == true {
            kind = .image
        } else if type?.conforms(to: .text) == true {
            kind = .text
        } else {
            kind = .other
        }

        let material = StudyMaterial(
            name: sourceURL.lastPathComponent,
            relativePath: "\(materialsFolder)/\(destinationName)",
            kind: kind,
            fileExtension: fileExtension,
            sizeInBytes: size
        )
        materials.insert(material, at: 0)
        persist(materials, forKey: materialsKey)
    }

    func localURL(for material: StudyMaterial) -> URL? {
        let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsURL.appendingPathComponent(material.relativePath)
        return FileManager.default.fileExists(atPath: fileURL.path) ? fileURL : nil
    }

    func delete(_ material: StudyMaterial) {
        if let url = localURL(for: material) {
            try? FileManager.default.removeItem(at: url)
        }
        materials.removeAll { $0.id == material.id }
        persist(materials, forKey: materialsKey)
    }

    private static func loadNotes(
        from defaults: UserDefaults,
        storageKey: String,
        legacyKey: String,
        initial: [StudyNote]
    ) -> [StudyNote] {
        if let data = defaults.data(forKey: storageKey) {
            return (try? JSONDecoder().decode([StudyNote].self, from: data)) ?? []
        }

        if let legacyData = defaults.data(forKey: legacyKey) {
            let migrated = (try? JSONDecoder().decode([StudyNote].self, from: legacyData)) ?? []
            if let encoded = try? JSONEncoder().encode(migrated) {
                defaults.set(encoded, forKey: storageKey)
            }
            return migrated
        }

        if let encoded = try? JSONEncoder().encode(initial) {
            defaults.set(encoded, forKey: storageKey)
        }
        return initial
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
