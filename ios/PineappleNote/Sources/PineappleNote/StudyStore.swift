import Foundation
import SwiftUI
import UniformTypeIdentifiers

@MainActor
final class StudyStore: ObservableObject {
    @Published private(set) var notes: [StudyNote]
    @Published private(set) var flashcards: [StudyFlashcard]
    @Published private(set) var questions: [StudyQuestion]
    @Published private(set) var quizAttempts: [StudyQuizAttempt]
    @Published private(set) var materials: [StudyMaterial]

    private let defaults: UserDefaults
    private let notesKey = "pineapple.local-notes.v2"
    private let legacyNotesKey = "pineapple.local-notes.v1"
    private let flashcardsKey = "pineapple.local-flashcards.v1"
    private let questionsKey = "pineapple.local-questions.v1"
    private let quizAttemptsKey = "pineapple.local-quiz-attempts.v1"
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
        quizAttempts = Self.loadArray(forKey: quizAttemptsKey, from: defaults, initial: [])
            .sorted { $0.completedAt > $1.completedAt }
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


    func makeBackupData() throws -> Data {
        let backup = StudyBackup(
            schemaVersion: 1,
            exportedAt: .now,
            notes: notes,
            flashcards: flashcards,
            questions: questions,
            quizAttempts: quizAttempts
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        return try encoder.encode(backup)
    }

    func restoreBackup(from data: Data) throws {
        guard data.count <= 25 * 1024 * 1024 else {
            throw StudyBackupError.fileTooLarge
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let backup = try decoder.decode(StudyBackup.self, from: data)

        guard backup.schemaVersion == 1 else {
            throw StudyBackupError.unsupportedVersion
        }
        guard backup.notes.count <= 10_000,
              backup.flashcards.count <= 20_000,
              backup.questions.count <= 20_000 else {
            throw StudyBackupError.tooManyItems
        }

        var mergedNotes = notes
        for item in backup.notes where !item.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            if let index = mergedNotes.firstIndex(where: { $0.id == item.id }) {
                mergedNotes[index] = item
            } else {
                mergedNotes.append(item)
            }
        }

        var mergedFlashcards = flashcards
        for item in backup.flashcards where
            !item.question.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
            !item.answer.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            if let index = mergedFlashcards.firstIndex(where: { $0.id == item.id }) {
                mergedFlashcards[index] = item
            } else {
                mergedFlashcards.append(item)
            }
        }

        var mergedQuestions = questions
        for item in backup.questions where item.hasValidAnswers &&
            !item.prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            if let index = mergedQuestions.firstIndex(where: { $0.id == item.id }) {
                mergedQuestions[index] = item
            } else {
                mergedQuestions.append(item)
            }
        }

        var mergedAttempts = quizAttempts
        for item in backup.quizAttempts ?? [] where
            item.totalQuestions > 0 &&
            item.correctAnswers >= 0 &&
            item.correctAnswers <= item.totalQuestions {
            if let index = mergedAttempts.firstIndex(where: { $0.id == item.id }) {
                mergedAttempts[index] = item
            } else {
                mergedAttempts.append(item)
            }
        }

        notes = mergedNotes.sorted { $0.updatedAt > $1.updatedAt }
        flashcards = mergedFlashcards.sorted { $0.createdAt > $1.createdAt }
        questions = mergedQuestions.sorted { $0.createdAt > $1.createdAt }
        quizAttempts = mergedAttempts.sorted { $0.completedAt > $1.completedAt }
        persist(notes, forKey: notesKey)
        persist(flashcards, forKey: flashcardsKey)
        persist(questions, forKey: questionsKey)
        persist(quizAttempts, forKey: quizAttemptsKey)
    }


    func recordQuizAttempt(totalQuestions: Int, correctAnswers: Int, subject: String) {
        guard totalQuestions > 0,
              correctAnswers >= 0,
              correctAnswers <= totalQuestions else { return }
        let cleanSubject = subject.trimmingCharacters(in: .whitespacesAndNewlines)
        let attempt = StudyQuizAttempt(
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers,
            subject: cleanSubject.isEmpty ? "Geral" : cleanSubject
        )
        quizAttempts.insert(attempt, at: 0)
        quizAttempts.sort { $0.completedAt > $1.completedAt }
        persist(quizAttempts, forKey: quizAttemptsKey)
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


    func registerRecordedAudio(at fileURL: URL, displayName: String) throws {
        let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .standardizedFileURL
        let folderURL = documentsURL.appendingPathComponent(materialsFolder, isDirectory: true)
            .standardizedFileURL
        let candidateURL = fileURL.standardizedFileURL

        guard candidateURL.path.hasPrefix(folderURL.path + "/") else {
            throw StudyMaterialStoreError.fileOutsideLibrary
        }
        guard FileManager.default.fileExists(atPath: candidateURL.path) else {
            throw StudyMaterialStoreError.fileNotFound
        }

        let attributes = try FileManager.default.attributesOfItem(atPath: candidateURL.path)
        let size = (attributes[.size] as? NSNumber)?.int64Value ?? 0
        let relativePath = String(candidateURL.path.dropFirst(documentsURL.path.count + 1))
        let cleanName = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        let material = StudyMaterial(
            name: cleanName.isEmpty ? candidateURL.lastPathComponent : cleanName,
            relativePath: relativePath,
            kind: .audio,
            fileExtension: candidateURL.pathExtension.lowercased(),
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


enum StudyMaterialStoreError: LocalizedError {
    case fileOutsideLibrary
    case fileNotFound

    var errorDescription: String? {
        switch self {
        case .fileOutsideLibrary:
            return "A gravação precisa estar dentro da biblioteca do Pineapple Note."
        case .fileNotFound:
            return "O arquivo da gravação não foi encontrado."
        }
    }
}


struct StudyBackup: Codable {
    var schemaVersion: Int
    var exportedAt: Date
    var notes: [StudyNote]
    var flashcards: [StudyFlashcard]
    var questions: [StudyQuestion]
    var quizAttempts: [StudyQuizAttempt]?
}

enum StudyBackupError: LocalizedError {
    case fileTooLarge
    case unsupportedVersion
    case tooManyItems

    var errorDescription: String? {
        switch self {
        case .fileTooLarge:
            return "O arquivo de backup ultrapassa o limite de 25 MB."
        case .unsupportedVersion:
            return "Este backup foi criado por uma versão incompatível do Pineapple Note."
        case .tooManyItems:
            return "O backup contém mais itens do que o aplicativo aceita."
        }
    }
}
