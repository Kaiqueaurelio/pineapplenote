import Foundation

struct StudyNote: Identifiable, Codable, Equatable {
    var id: UUID
    var title: String
    var body: String
    var subject: String
    var updatedAt: Date

    init(id: UUID = UUID(), title: String, body: String, subject: String = "Geral", updatedAt: Date = .now) {
        self.id = id
        self.title = title
        self.body = body
        self.subject = subject
        self.updatedAt = updatedAt
    }

    var preview: String {
        let trimmed = body.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "Toque para adicionar suas anotações." : trimmed
    }

    var exportText: String {
        """
        \(title)
        Matéria: \(subject)
        Atualizada em: \(updatedAt.formatted(date: .long, time: .shortened))

        \(body)
        """
    }
}

struct StudyFlashcard: Identifiable, Codable, Equatable {
    var id: UUID
    var question: String
    var answer: String
    var subject: String
    var createdAt: Date
    var reviewCount: Int
    var lastReviewedAt: Date?
    var correctStreak: Int?
    var nextReviewAt: Date?

    init(
        id: UUID = UUID(),
        question: String,
        answer: String,
        subject: String = "Geral",
        createdAt: Date = .now,
        reviewCount: Int = 0,
        lastReviewedAt: Date? = nil,
        correctStreak: Int? = 0,
        nextReviewAt: Date? = nil
    ) {
        self.id = id
        self.question = question
        self.answer = answer
        self.subject = subject
        self.createdAt = createdAt
        self.reviewCount = reviewCount
        self.lastReviewedAt = lastReviewedAt
        self.correctStreak = correctStreak
        self.nextReviewAt = nextReviewAt
    }
}

struct StudyQuestion: Identifiable, Codable, Equatable {
    var id: UUID
    var prompt: String
    var options: [String]
    var correctOptionIndex: Int
    var explanation: String
    var subject: String
    var createdAt: Date

    init(
        id: UUID = UUID(),
        prompt: String,
        options: [String],
        correctOptionIndex: Int,
        explanation: String = "",
        subject: String = "Geral",
        createdAt: Date = .now
    ) {
        self.id = id
        self.prompt = prompt
        self.options = options
        self.correctOptionIndex = correctOptionIndex
        self.explanation = explanation
        self.subject = subject
        self.createdAt = createdAt
    }

    var hasValidAnswers: Bool {
        options.count == 4 &&
        options.allSatisfy { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty } &&
        options.indices.contains(correctOptionIndex)
    }
}

enum StudyMaterialKind: String, Codable {
    case pdf
    case audio
    case video
    case image
    case text
    case link
    case other

    var title: String {
        switch self {
        case .pdf: "PDF"
        case .audio: "Áudio"
        case .video: "Vídeo"
        case .image: "Imagem"
        case .text: "Texto"
        case .link: "Link"
        case .other: "Arquivo"
        }
    }

    var symbol: String {
        switch self {
        case .pdf: "doc.text.fill"
        case .audio: "waveform"
        case .video: "video.fill"
        case .image: "photo.fill"
        case .text: "doc.plaintext"
        case .link: "link"
        case .other: "doc.fill"
        }
    }
}

struct StudyMaterial: Identifiable, Codable, Equatable {
    var id: UUID
    var name: String
    var relativePath: String
    var kind: StudyMaterialKind
    var fileExtension: String
    var sizeInBytes: Int64
    var importedAt: Date
    var sourceURL: String?

    init(
        id: UUID = UUID(),
        name: String,
        relativePath: String,
        kind: StudyMaterialKind,
        fileExtension: String,
        sizeInBytes: Int64,
        importedAt: Date = .now,
        sourceURL: String? = nil
    ) {
        self.id = id
        self.name = name
        self.relativePath = relativePath
        self.kind = kind
        self.fileExtension = fileExtension
        self.sizeInBytes = sizeInBytes
        self.importedAt = importedAt
        self.sourceURL = sourceURL
    }
}


struct StudyQuizAttempt: Identifiable, Codable, Equatable {
    var id: UUID
    var completedAt: Date
    var totalQuestions: Int
    var correctAnswers: Int
    var subject: String

    init(
        id: UUID = UUID(),
        completedAt: Date = .now,
        totalQuestions: Int,
        correctAnswers: Int,
        subject: String = "Geral"
    ) {
        self.id = id
        self.completedAt = completedAt
        self.totalQuestions = totalQuestions
        self.correctAnswers = correctAnswers
        self.subject = subject
    }

    var percentage: Int {
        guard totalQuestions > 0 else { return 0 }
        return Int((Double(correctAnswers) / Double(totalQuestions) * 100).rounded())
    }
}
