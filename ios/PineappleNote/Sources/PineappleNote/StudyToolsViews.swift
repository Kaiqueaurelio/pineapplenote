import SwiftUI

struct StudyToolsView: View {
    @ObservedObject var store: StudyStore
    @State private var showingAssistantInfo = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 17) {
                    Text("Ferramentas de estudo")
                        .font(.system(size: 27, weight: .bold, design: .rounded))
                        .foregroundStyle(PineapplePalette.ink)
                    Text("Crie seus próprios materiais e pratique mesmo sem internet.")
                        .foregroundStyle(PineapplePalette.muted)

                    NavigationLink {
                        FlashcardsView(store: store)
                    } label: {
                        ToolCard(
                            title: "Flashcards",
                            subtitle: "\(store.flashcards.count) cartões • Pergunta, resposta e revisão",
                            icon: "rectangle.on.rectangle.angled",
                            tint: Color(red: 0.82, green: 0.88, blue: 0.96)
                        )
                    }
                    .buttonStyle(.plain)

                    NavigationLink {
                        QuizView(store: store)
                    } label: {
                        ToolCard(
                            title: "Quiz e simulados",
                            subtitle: "\(store.questions.count) questões • Alternativas, correção e pontuação",
                            icon: "checkmark.circle.fill",
                            tint: Color(red: 0.85, green: 0.90, blue: 0.78)
                        )
                    }
                    .buttonStyle(.plain)

                    Button { showingAssistantInfo = true } label: {
                        ToolCard(
                            title: "Resumo inteligente",
                            subtitle: "A geração automática será conectada à IA do Pineapple.",
                            icon: "text.alignleft",
                            tint: Color(red: 0.91, green: 0.83, blue: 0.67)
                        )
                    }
                    .buttonStyle(.plain)

                    Button { showingAssistantInfo = true } label: {
                        ToolCard(
                            title: "Chat com IA",
                            subtitle: "Faça perguntas sobre seus materiais de estudo.",
                            icon: "sparkles",
                            tint: Color(red: 0.89, green: 0.84, blue: 0.94)
                        )
                    }
                    .buttonStyle(.plain)

                    Text("Flashcards e simulados funcionam localmente. Os recursos de IA serão conectados ao servidor existente; nenhuma chave de provedor será armazenada no iPhone.")
                        .font(.system(size: 11))
                        .foregroundStyle(PineapplePalette.muted)
                        .padding(.top, 5)
                }
                .padding(20)
            }
            .background(PineapplePalette.cream.ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
        }
        .alert("Recursos de IA", isPresented: $showingAssistantInfo) {
            Button("Entendi", role: .cancel) {}
        } message: {
            Text("A integração com resumos e chat será feita usando o backend seguro do Pineapple Note. Esta etapa ainda não está ativa no aplicativo nativo.")
        }
    }
}

private struct ToolCard: View {
    let title: String
    let subtitle: String
    let icon: String
    let tint: Color

    var body: some View {
        HStack(spacing: 13) {
            Image(systemName: icon)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(PineapplePalette.green)
                .frame(width: 46, height: 46)
                .background(tint, in: RoundedRectangle(cornerRadius: 13))
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(PineapplePalette.ink)
                Text(subtitle)
                    .font(.system(size: 11))
                    .foregroundStyle(PineapplePalette.muted)
                    .multilineTextAlignment(.leading)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PineapplePalette.muted)
        }
        .padding(13)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.white, in: RoundedRectangle(cornerRadius: 17))
    }
}

struct FlashcardsView: View {
    @ObservedObject var store: StudyStore
    @State private var currentIndex = 0
    @State private var showingAnswer = false
    @State private var showingEditor = false
    @State private var editingCard: StudyFlashcard?

    private var activeCard: StudyFlashcard? {
        guard store.flashcards.indices.contains(currentIndex) else { return nil }
        return store.flashcards[currentIndex]
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Flashcards")
                            .font(.system(size: 27, weight: .bold, design: .rounded))
                        Text("\(store.flashcards.count) cartões salvos neste iPhone")
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
                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            Text(card.subject.uppercased())
                                .font(.system(size: 10, weight: .bold))
                                .tracking(1)
                            Spacer()
                            Text("\(currentIndex + 1) / \(store.flashcards.count)")
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

                        Button {
                            if !showingAnswer { store.markReviewed(card) }
                            showingAnswer.toggle()
                        } label: {
                            Label(showingAnswer ? "Voltar à pergunta" : "Mostrar resposta", systemImage: "eye")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 13)
                                .background(PineapplePalette.green, in: Capsule())
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
                    }

                    HStack(spacing: 12) {
                        Button {
                            currentIndex = currentIndex == 0 ? store.flashcards.count - 1 : currentIndex - 1
                            showingAnswer = false
                        } label: {
                            Label("Anterior", systemImage: "chevron.left")
                                .frame(maxWidth: .infinity)
                        }
                        .disabled(store.flashcards.count < 2)

                        Button {
                            currentIndex = (currentIndex + 1) % store.flashcards.count
                            showingAnswer = false
                        } label: {
                            Label("Próximo", systemImage: "chevron.right")
                                .frame(maxWidth: .infinity)
                        }
                        .disabled(store.flashcards.count < 2)
                    }
                    .font(.system(size: 12, weight: .semibold))
                    .buttonStyle(.bordered)
                    .tint(PineapplePalette.green)

                    Text("Este cartão já foi revisado \(card.reviewCount) vez(es).")
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
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(card.question)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundStyle(PineapplePalette.ink)
                                        .lineLimit(2)
                                    Text(card.subject)
                                        .font(.system(size: 10))
                                        .foregroundStyle(PineapplePalette.muted)
                                }
                                Spacer()
                                Button { openEditor(card) } label: {
                                    Image(systemName: "pencil")
                                        .foregroundStyle(PineapplePalette.green)
                                }
                                Button(role: .destructive) { store.delete(card) } label: {
                                    Image(systemName: "trash")
                                }
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
        .onChange(of: store.flashcards.count) { _, newCount in
            currentIndex = min(currentIndex, max(newCount - 1, 0))
            showingAnswer = false
        }
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
                        let card = StudyFlashcard(
                            id: existingCard?.id ?? UUID(),
                            question: cleanQuestion,
                            answer: cleanAnswer,
                            subject: cleanSubject.isEmpty ? "Geral" : cleanSubject,
                            createdAt: existingCard?.createdAt ?? .now,
                            reviewCount: existingCard?.reviewCount ?? 0,
                            lastReviewedAt: existingCard?.lastReviewedAt
                        )
                        onSave(card)
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

struct QuizView: View {
    @ObservedObject var store: StudyStore
    @State private var showingEditor = false
    @State private var editingQuestion: StudyQuestion?
    @State private var quizQuestions: [StudyQuestion] = []
    @State private var questionIndex = 0
    @State private var selectedOption: Int?
    @State private var score = 0
    @State private var isAnswerChecked = false
    @State private var isFinished = false

    private var currentQuestion: StudyQuestion? {
        guard quizQuestions.indices.contains(questionIndex) else { return nil }
        return quizQuestions[questionIndex]
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 17) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Quiz e simulados")
                            .font(.system(size: 27, weight: .bold, design: .rounded))
                        Text("\(store.questions.count) questões cadastradas")
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
                    .accessibilityLabel("Criar questão")
                }

                if isFinished {
                    resultView
                } else if let question = currentQuestion {
                    quizQuestionView(question)
                } else if !store.questions.isEmpty {
                    Button {
                        startQuiz()
                    } label: {
                        Label("Iniciar simulado", systemImage: "play.fill")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 15)
                            .background(PineapplePalette.green, in: Capsule())
                    }
                    Text("O simulado usa as questões que você cadastrou e embaralha a ordem a cada tentativa.")
                        .font(.system(size: 11))
                        .foregroundStyle(PineapplePalette.muted)
                } else {
                    EmptyStudyState(
                        icon: "checkmark.circle",
                        title: "Seu banco de questões está vazio",
                        message: "Cadastre perguntas com quatro alternativas, escolha a correta e monte seus próprios simulados.",
                        actionTitle: "Criar primeira questão"
                    ) { openEditor(nil) }
                }

                if !store.questions.isEmpty && currentQuestion == nil && !isFinished {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Banco de questões")
                            .font(.system(size: 17, weight: .bold, design: .rounded))
                        ForEach(store.questions) { question in
                            HStack(spacing: 10) {
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(question.prompt)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundStyle(PineapplePalette.ink)
                                        .lineLimit(2)
                                    Text(question.subject)
                                        .font(.system(size: 10))
                                        .foregroundStyle(PineapplePalette.muted)
                                }
                                Spacer()
                                Button { openEditor(question) } label: {
                                    Image(systemName: "pencil")
                                        .foregroundStyle(PineapplePalette.green)
                                }
                                Button(role: .destructive) { store.delete(question) } label: {
                                    Image(systemName: "trash")
                                }
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
        .navigationTitle("Simulados")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingEditor) {
            QuestionEditorSheet(question: editingQuestion) { store.save($0) }
        }
    }

    private func quizQuestionView(_ question: StudyQuestion) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text(question.subject.uppercased())
                    .font(.system(size: 10, weight: .bold))
                    .tracking(1)
                    .foregroundStyle(PineapplePalette.green)
                Spacer()
                Text("Questão \(questionIndex + 1) de \(quizQuestions.count)")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(PineapplePalette.muted)
            }

            Text(question.prompt)
                .font(.system(size: 19, weight: .bold, design: .rounded))
                .foregroundStyle(PineapplePalette.ink)

            ForEach(question.options.indices, id: \.self) { index in
                Button {
                    select(index, for: question)
                } label: {
                    HStack(alignment: .center, spacing: 11) {
                        Text(String(UnicodeScalar(65 + index)!))
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(PineapplePalette.green)
                            .frame(width: 28, height: 28)
                            .background(PineapplePalette.lime.opacity(0.4), in: Circle())
                        Text(question.options[index])
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(PineapplePalette.ink)
                            .multilineTextAlignment(.leading)
                        Spacer()
                        if isAnswerChecked && index == question.correctOptionIndex {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                        } else if isAnswerChecked && index == selectedOption {
                            Image(systemName: "xmark.circle.fill").foregroundStyle(.red)
                        }
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(optionBackground(index: index, correctIndex: question.correctOptionIndex), in: RoundedRectangle(cornerRadius: 13))
                }
                .buttonStyle(.plain)
                .disabled(isAnswerChecked)
            }

            if isAnswerChecked {
                VStack(alignment: .leading, spacing: 6) {
                    Text(selectedOption == question.correctOptionIndex ? "Resposta correta!" : "Não foi dessa vez.")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(selectedOption == question.correctOptionIndex ? .green : .red)
                    if !question.explanation.isEmpty {
                        Text(question.explanation)
                            .font(.system(size: 12))
                            .foregroundStyle(PineapplePalette.muted)
                    }
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(.white, in: RoundedRectangle(cornerRadius: 13))

                Button {
                    advanceQuiz()
                } label: {
                    Text(questionIndex == quizQuestions.count - 1 ? "Ver resultado" : "Próxima questão")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(PineapplePalette.green, in: Capsule())
                }
            }

            Button("Encerrar simulado") {
                quizQuestions = []
                isFinished = false
                selectedOption = nil
                isAnswerChecked = false
            }
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(PineapplePalette.muted)
            .frame(maxWidth: .infinity)
            .padding(.top, 4)
        }
        .padding(16)
        .background(.white, in: RoundedRectangle(cornerRadius: 18))
    }

    private var resultView: some View {
        VStack(spacing: 13) {
            Image(systemName: "trophy.fill")
                .font(.system(size: 42))
                .foregroundStyle(PineapplePalette.green)
            Text("Simulado concluído!")
                .font(.system(size: 21, weight: .bold, design: .rounded))
            Text("\(score) de \(quizQuestions.count) acertos")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(PineapplePalette.green)
            Text("Continue praticando para consolidar o conteúdo.")
                .font(.system(size: 12))
                .foregroundStyle(PineapplePalette.muted)
            Button("Refazer simulado") { startQuiz() }
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(PineapplePalette.green, in: Capsule())
            Button("Voltar ao banco de questões") {
                quizQuestions = []
                isFinished = false
            }
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(PineapplePalette.green)
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .background(.white, in: RoundedRectangle(cornerRadius: 19))
    }

    private func optionBackground(index: Int, correctIndex: Int) -> Color {
        guard isAnswerChecked else { return PineapplePalette.cream }
        if index == correctIndex { return Color.green.opacity(0.12) }
        if index == selectedOption { return Color.red.opacity(0.10) }
        return PineapplePalette.cream
    }

    private func select(_ index: Int, for question: StudyQuestion) {
        guard !isAnswerChecked else { return }
        selectedOption = index
        isAnswerChecked = true
        if index == question.correctOptionIndex { score += 1 }
    }

    private func startQuiz() {
        quizQuestions = store.questions.filter(\.hasValidAnswers).shuffled()
        questionIndex = 0
        score = 0
        selectedOption = nil
        isAnswerChecked = false
        isFinished = false
    }

    private func advanceQuiz() {
        if questionIndex + 1 >= quizQuestions.count {
            isFinished = true
            return
        }
        questionIndex += 1
        selectedOption = nil
        isAnswerChecked = false
    }

    private func openEditor(_ question: StudyQuestion?) {
        editingQuestion = question
        showingEditor = true
    }
}

private struct QuestionEditorSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var prompt: String
    @State private var options: [String]
    @State private var correctIndex: Int
    @State private var explanation: String
    @State private var subject: String

    let existingQuestion: StudyQuestion?
    let onSave: (StudyQuestion) -> Void

    init(question: StudyQuestion?, onSave: @escaping (StudyQuestion) -> Void) {
        existingQuestion = question
        self.onSave = onSave
        _prompt = State(initialValue: question?.prompt ?? "")
        _options = State(initialValue: question?.options.count == 4 ? question!.options : ["", "", "", ""])
        _correctIndex = State(initialValue: question?.correctOptionIndex ?? 0)
        _explanation = State(initialValue: question?.explanation ?? "")
        _subject = State(initialValue: question?.subject ?? "Geral")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Pergunta") {
                    TextField("Digite a pergunta", text: $prompt, axis: .vertical)
                }
                Section("Alternativas") {
                    ForEach(0..<4, id: \.self) { index in
                        TextField("Alternativa \(index + 1)", text: Binding(
                            get: { options[index] },
                            set: { options[index] = $0 }
                        ))
                    }
                    Picker("Resposta correta", selection: $correctIndex) {
                        ForEach(0..<4, id: \.self) { index in
                            Text("Alternativa \(index + 1)").tag(index)
                        }
                    }
                }
                Section("Explicação (opcional)") {
                    TextEditor(text: $explanation)
                        .frame(minHeight: 80)
                }
                Section("Matéria") {
                    TextField("Ex.: Biologia", text: $subject)
                }
            }
            .navigationTitle(existingQuestion == nil ? "Nova questão" : "Editar questão")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Salvar") {
                        let cleanPrompt = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
                        let cleanOptions = options.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                        guard !cleanPrompt.isEmpty,
                              cleanOptions.allSatisfy({ !$0.isEmpty }) else { return }
                        let cleanSubject = subject.trimmingCharacters(in: .whitespacesAndNewlines)
                        let question = StudyQuestion(
                            id: existingQuestion?.id ?? UUID(),
                            prompt: cleanPrompt,
                            options: cleanOptions,
                            correctOptionIndex: correctIndex,
                            explanation: explanation.trimmingCharacters(in: .whitespacesAndNewlines),
                            subject: cleanSubject.isEmpty ? "Geral" : cleanSubject,
                            createdAt: existingQuestion?.createdAt ?? .now
                        )
                        onSave(question)
                        dismiss()
                    }
                    .fontWeight(.bold)
                    .disabled(
                        prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
                        options.contains(where: { $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty })
                    )
                }
            }
        }
    }
}

private struct EmptyStudyState: View {
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
