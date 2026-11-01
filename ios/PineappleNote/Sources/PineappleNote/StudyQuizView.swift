import SwiftUI

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

    private var validQuestions: [StudyQuestion] {
        store.questions.filter(\.hasValidAnswers)
    }

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
                    questionView(question)
                } else if validQuestions.isEmpty {
                    EmptyStudyState(
                        icon: "checkmark.circle",
                        title: "Seu banco de questões está vazio",
                        message: "Cadastre perguntas com quatro alternativas, escolha a correta e monte seus próprios simulados.",
                        actionTitle: "Criar primeira questão"
                    ) { openEditor(nil) }
                } else {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("\(validQuestions.count) questões prontas para praticar")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(PineapplePalette.ink)
                        Button(action: startQuiz) {
                            Label("Iniciar simulado", systemImage: "play.fill")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 15)
                                .background(PineapplePalette.green, in: Capsule())
                        }
                        Text("A ordem das questões muda a cada tentativa.")
                            .font(.system(size: 11))
                            .foregroundStyle(PineapplePalette.muted)
                    }
                    .padding(16)
                    .background(.white, in: RoundedRectangle(cornerRadius: 18))
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
                                .accessibilityLabel("Editar questão")
                                Button(role: .destructive) { store.delete(question) } label: {
                                    Image(systemName: "trash")
                                }
                                .accessibilityLabel("Excluir questão")
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

    private func questionView(_ question: StudyQuestion) -> some View {
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
                    HStack(spacing: 11) {
                        Text(["A", "B", "C", "D"][index])
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
                    Text(selectedOption == question.correctOptionIndex ? "Resposta correta!" : "Resposta incorreta.")
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
                .background(PineapplePalette.cream, in: RoundedRectangle(cornerRadius: 13))

                Button(action: advanceQuiz) {
                    Text(questionIndex == quizQuestions.count - 1 ? "Ver resultado" : "Próxima questão")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(PineapplePalette.green, in: Capsule())
                }
            }

            Button("Encerrar simulado") {
                resetQuiz()
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
            Text(quizQuestions.isEmpty ? "Nenhuma questão foi respondida." : "Você acertou \(Int((Double(score) / Double(quizQuestions.count) * 100).rounded()))% do simulado.")
                .font(.system(size: 12))
                .foregroundStyle(PineapplePalette.muted)
            Button("Refazer simulado") { startQuiz() }
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(PineapplePalette.green, in: Capsule())
            Button("Voltar ao banco de questões") { resetQuiz() }
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
        guard !isAnswerChecked, question.options.indices.contains(index) else { return }
        selectedOption = index
        isAnswerChecked = true
        if index == question.correctOptionIndex { score += 1 }
    }

    private func startQuiz() {
        let shuffled = validQuestions.shuffled()
        guard !shuffled.isEmpty else { return }
        quizQuestions = shuffled
        questionIndex = 0
        score = 0
        selectedOption = nil
        isAnswerChecked = false
        isFinished = false
    }

    private func advanceQuiz() {
        guard questionIndex + 1 < quizQuestions.count else {
            isFinished = true
            return
        }
        questionIndex += 1
        selectedOption = nil
        isAnswerChecked = false
    }

    private func resetQuiz() {
        quizQuestions = []
        questionIndex = 0
        score = 0
        selectedOption = nil
        isAnswerChecked = false
        isFinished = false
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
        let initialOptions = question?.options.count == 4 ? (question?.options ?? ["", "", "", ""]) : ["", "", "", ""]
        _options = State(initialValue: initialOptions)
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
                              cleanOptions.count == 4,
                              cleanOptions.allSatisfy({ !$0.isEmpty }),
                              (0..<4).contains(correctIndex) else { return }
                        let cleanSubject = subject.trimmingCharacters(in: .whitespacesAndNewlines)
                        onSave(StudyQuestion(
                            id: existingQuestion?.id ?? UUID(),
                            prompt: cleanPrompt,
                            options: cleanOptions,
                            correctOptionIndex: correctIndex,
                            explanation: explanation.trimmingCharacters(in: .whitespacesAndNewlines),
                            subject: cleanSubject.isEmpty ? "Geral" : cleanSubject,
                            createdAt: existingQuestion?.createdAt ?? .now
                        ))
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
