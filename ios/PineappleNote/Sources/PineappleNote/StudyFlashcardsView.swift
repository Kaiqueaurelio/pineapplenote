import SwiftUI

struct FlashcardsView: View {
    @ObservedObject var store: StudyStore
    @State private var currentCardID: UUID?
    @State private var showingAnswer = false
    @State private var showingEditor = false
    @State private var editingCard: StudyFlashcard?

    private var dueCount: Int {
        store.flashcards.filter { card in
            guard let nextReviewAt = card.nextReviewAt else { return true }
            return nextReviewAt <= .now
        }.count
    }

    private var activeCard: StudyFlashcard? {
        if let currentCardID,
           let matching = store.flashcards.first(where: { $0.id == currentCardID }) {
            return matching
        }
        return store.flashcards.first
    }

    private var activeIndex: Int {
        guard let activeCard else { return 0 }
        return store.flashcards.firstIndex(where: { $0.id == activeCard.id }) ?? 0
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Flashcards")
                            .font(.system(size: 27, weight: .bold, design: .rounded))
                        Text("\(store.flashcards.count) cartões • \(dueCount) para revisar")
                            .font(.system(size: 12))
                            .foregroundStyle(PineapplePalette.muted)
                    }
                    Spacer()
                    Button { openEditor(nil) } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 40, height: 40)
                            .background(PineapplePalette.green, in: Circle())
                    }
                    .accessibilityLabel("Criar flashcard")
                }

                if let card = activeCard {
                    flashcardPanel(card)
                    HStack(spacing: 12) {
                        Button {
                            move(by: -1)
                        } label: {
                            Label("Anterior", systemImage: "chevron.left")
                                .frame(maxWidth: .infinity)
                        }
                        .disabled(store.flashcards.count < 2)

                        Button {
                            move(by: 1)
                        } label: {
                            Label("Próximo", systemImage: "chevron.right")
                                .frame(maxWidth: .infinity)
                        }
                        .disabled(store.flashcards.count < 2)
                    }
                    .font(.system(size: 12, weight: .semibold))
                    .buttonStyle(.bordered)
                    .tint(PineapplePalette.green)

                    VStack(alignment: .leading, spacing: 3) {
                        Text("Revisões: \(card.reviewCount) • sequência correta: \(card.correctStreak ?? 0)")
                        if let nextReviewAt = card.nextReviewAt {
                            Text("Próxima revisão: \(nextReviewAt.formatted(date: .abbreviated, time: .shortened))")
                        } else {
                            Text("Ainda não revisado")
                        }
                    }
                    .font(.system(size: 11))
                    .foregroundStyle(PineapplePalette.muted)
                } else {
                    EmptyStudyState(
                        icon: "rectangle.on.rectangle.angled",
                        title: "Nenhum flashcard ainda",
                        message: "Crie cartões com perguntas de um lado e respostas do outro. Eles ficam salvos neste iPhone.",
                        actionTitle: "Criar primeiro flashcard"
                    ) { openEditor(nil) }
                }

                if !store.flashcards.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Seus cartões")
                            .font(.system(size: 17, weight: .bold, design: .rounded))
                        ForEach(store.flashcards) { card in
                            HStack(spacing: 10) {
                                Button {
                                    currentCardID = card.id
                                    showingAnswer = false
                                } label: {
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(card.question)
                                            .font(.system(size: 13, weight: .semibold))
                                            .foregroundStyle(PineapplePalette.ink)
                                            .lineLimit(2)
                                        Text(card.subject)
                                            .font(.system(size: 10))
                                            .foregroundStyle(PineapplePalette.muted)
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                }
                                .buttonStyle(.plain)
                                Button { openEditor(card) } label: {
                                    Image(systemName: "pencil")
                                        .foregroundStyle(PineapplePalette.green)
                                }
                                .accessibilityLabel("Editar flashcard")
                                Button(role: .destructive) { store.delete(card) } label: {
                                    Image(systemName: "trash")
                                }
                                .accessibilityLabel("Excluir flashcard")
                            }
                            .padding(12)
                            .background(.white, in: RoundedRectangle(cornerRadius: 13))
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(PineapplePalette.cream.ignoresSafeArea())
        .navigationTitle("Flashcards")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingEditor) {
            FlashcardEditorSheet(card: editingCard) { store.save($0) }
        }
        .onChange(of: store.flashcards.map(\.id)) { _, newIDs in
            if !newIDs.contains(currentCardID ?? UUID()) {
                currentCardID = newIDs.first
            }
            showingAnswer = false
        }
    }

    private func flashcardPanel(_ card: StudyFlashcard) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text(card.subject.uppercased())
                    .font(.system(size: 10, weight: .bold))
                    .tracking(1)
                Spacer()
                Text("\(activeIndex + 1) / \(store.flashcards.count)")
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
            }
            .foregroundStyle(PineapplePalette.green)

            Spacer(minLength: 22)
            Text(showingAnswer ? "RESPOSTA" : "PERGUNTA")
                .font(.system(size: 10, weight: .bold))
                .tracking(1.5)
                .foregroundStyle(PineapplePalette.muted)
            Text(showingAnswer ? card.answer : card.question)
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundStyle(PineapplePalette.ink)
                .frame(maxWidth: .infinity, alignment: .leading)
            Spacer(minLength: 22)

            if showingAnswer {
                HStack(spacing: 10) {
                    Button {
                        rate(card, remembered: false)
                    } label: {
                        Label("Preciso revisar", systemImage: "arrow.counterclockwise")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(PineapplePalette.green)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(PineapplePalette.lime.opacity(0.55), in: Capsule())
                    }
                    Button {
                        rate(card, remembered: true)
                    } label: {
                        Label("Lembrei!", systemImage: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(PineapplePalette.green, in: Capsule())
                    }
                }
            } else {
                Button {
                    showingAnswer = true
                } label: {
                    Label("Mostrar resposta", systemImage: "eye")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                        .background(PineapplePalette.green, in: Capsule())
                }
            }
        }
        .padding(22)
        .frame(maxWidth: .infinity, minHeight: 300, alignment: .leading)
        .background(PineapplePalette.lime.opacity(0.32), in: RoundedRectangle(cornerRadius: 23))
        .overlay(alignment: .bottomTrailing) {
            Image(systemName: "sparkle")
                .font(.system(size: 54, weight: .light))
                .foregroundStyle(PineapplePalette.green.opacity(0.12))
                .padding(18)
                .allowsHitTesting(false)
        }
    }

    private func rate(_ card: StudyFlashcard, remembered: Bool) {
        store.markReviewed(card, remembered: remembered)
        move(by: 1)
    }

    private func move(by offset: Int) {
        guard !store.flashcards.isEmpty else { return }
        let next = (activeIndex + offset + store.flashcards.count) % store.flashcards.count
        currentCardID = store.flashcards[next].id
        showingAnswer = false
    }

    private func openEditor(_ card: StudyFlashcard?) {
        editingCard = card
        showingEditor = true
    }
}

private struct FlashcardEditorSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var question: String
    @State private var answer: String
    @State private var subject: String

    let existingCard: StudyFlashcard?
    let onSave: (StudyFlashcard) -> Void

    init(card: StudyFlashcard?, onSave: @escaping (StudyFlashcard) -> Void) {
        existingCard = card
        self.onSave = onSave
        _question = State(initialValue: card?.question ?? "")
        _answer = State(initialValue: card?.answer ?? "")
        _subject = State(initialValue: card?.subject ?? "Geral")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Pergunta") {
                    TextField("Ex.: O que é fotossíntese?", text: $question, axis: .vertical)
                }
                Section("Resposta") {
                    TextEditor(text: $answer)
                        .frame(minHeight: 120)
                }
                Section("Organização") {
                    TextField("Matéria ou categoria", text: $subject)
                }
            }
            .navigationTitle(existingCard == nil ? "Novo flashcard" : "Editar flashcard")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Salvar") {
                        let cleanQuestion = question.trimmingCharacters(in: .whitespacesAndNewlines)
                        let cleanAnswer = answer.trimmingCharacters(in: .whitespacesAndNewlines)
                        guard !cleanQuestion.isEmpty, !cleanAnswer.isEmpty else { return }
                        let cleanSubject = subject.trimmingCharacters(in: .whitespacesAndNewlines)
                        onSave(StudyFlashcard(
                            id: existingCard?.id ?? UUID(),
                            question: cleanQuestion,
                            answer: cleanAnswer,
                            subject: cleanSubject.isEmpty ? "Geral" : cleanSubject,
                            createdAt: existingCard?.createdAt ?? .now,
                            reviewCount: existingCard?.reviewCount ?? 0,
                            lastReviewedAt: existingCard?.lastReviewedAt,
                            correctStreak: existingCard?.correctStreak ?? 0,
                            nextReviewAt: existingCard?.nextReviewAt
                        ))
                        dismiss()
                    }
                    .fontWeight(.bold)
                    .disabled(
                        question.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
                        answer.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                    )
                }
            }
        }
    }
}

struct EmptyStudyState: View {
    let icon: String
    let title: String
    let message: String
    let actionTitle: String
    let action: () -> Void

    var body: some View {
        VStack(spacing: 11) {
            Image(systemName: icon)
                .font(.system(size: 34))
                .foregroundStyle(PineapplePalette.green)
            Text(title)
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(PineapplePalette.ink)
            Text(message)
                .font(.system(size: 12))
                .foregroundStyle(PineapplePalette.muted)
                .multilineTextAlignment(.center)
            Button(actionTitle, action: action)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 18)
                .padding(.vertical, 11)
                .background(PineapplePalette.green, in: Capsule())
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .background(.white, in: RoundedRectangle(cornerRadius: 18))
    }
}
