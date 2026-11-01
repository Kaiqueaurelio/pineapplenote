import Foundation

struct StudyNote: Identifiable, Codable, Equatable {
    var id: UUID
    var title: String
    var body: String
    var subject: String
    var updatedAt: Date

    init(
        id: UUID = UUID(),
        title: String,
        body: String,
        subject: String = "Geral",
        updatedAt: Date = .now
    ) {
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
}

struct StudyFlashcard: Identifiable, Codable, Equatable {
    var id: UUID
    var question: String
    var answer: String
    var subject: String
    var createdAt: Date
    var reviewCount: Int
    var lastReviewedAt: Date?

    init(
        id: UUID = UUID(),
        question: String,
        answer: String,
        subject: String = "Geral",
        createdAt: Date = .now,
        reviewCount: Int = 0,
        lastReviewedAt: Date? = nil
    ) {
        self.id = id
        self.question = question
        self.answer = answer
        self.subject = subject
        self.createdAt = createdAt
        self.reviewCount = reviewCount
        self.lastReviewedAt = lastReviewedAt
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
