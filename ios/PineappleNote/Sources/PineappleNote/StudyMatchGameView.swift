import SwiftUI

private enum MatchCardSide {
    case question
    case answer
}

private struct MatchGameCard: Identifiable {
    let id = UUID()
    let pairID: UUID
    let side: MatchCardSide
    let text: String
}

struct StudyMatchGameView: View {
    @ObservedObject var store: StudyStore
    @State private var cards: [MatchGameCard] = []
    @State private var selectedCardIDs: [UUID] = []
    @State private var matchedPairIDs: Set<UUID> = []
    @State private var moves = 0
    @State private var isResolvingMismatch = false

    private let columns = [
        GridItem(.flexible(), spacing: 10),
        GridItem(.flexible(), spacing: 10)
    ]

    private var pairCount: Int {
        Set(cards.map(\.pairID)).count
    }

    private var isFinished: Bool {
        pairCount > 0 && matchedPairIDs.count == pairCount
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 17) {
                VStack(alignment: .leading, spacing: 5) {
                    Text("Card Match")
                        .font(.system(size: 27, weight: .bold, design: .rounded))
                        .foregroundStyle(PineapplePalette.ink)
                    Text("Encontre a pergunta e a resposta que pertencem ao mesmo flashcard.")
                        .font(.system(size: 12))
                        .foregroundStyle(PineapplePalette.muted)
                }

                if store.flashcards.isEmpty {
                    EmptyStudyState(
                        icon: "rectangle.on.rectangle.angled",
                        title: "Crie flashcards primeiro",
                        message: "O jogo usa os cartões que você já cadastrou. Crie pelo menos um par de pergunta e resposta para começar.",
                        actionTitle: "Voltar às ferramentas"
                    ) {}
                } else {
                    HStack(spacing: 10) {
                        scoreTile(title: "Jogadas", value: "\(moves)", icon: "hand.tap")
                        scoreTile(title: "Pares", value: "\(matchedPairIDs.count)/\(pairCount)", icon: "checkmark.circle")
                    }

                    if isFinished {
                        VStack(spacing: 10) {
                            Image(systemName: "trophy.fill")
                                .font(.system(size: 42))
                                .foregroundStyle(PineapplePalette.green)
                            Text("Todos os pares encontrados!")
                                .font(.system(size: 19, weight: .bold, design: .rounded))
                                .foregroundStyle(PineapplePalette.ink)
                            Text("Você concluiu o jogo em \(moves) jogadas.")
                                .font(.system(size: 12))
                                .foregroundStyle(PineapplePalette.muted)
                            Button("Jogar novamente", action: startGame)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 12)
                                .background(PineapplePalette.green, in: Capsule())
                        }
                        .frame(maxWidth: .infinity)
                        .padding(20)
                        .background(.white, in: RoundedRectangle(cornerRadius: 18))
                    } else {
                        LazyVGrid(columns: columns, spacing: 10) {
                            ForEach(cards) { card in
                                matchCardButton(card)
                            }
                        }
                        Button("Recomeçar partida", action: startGame)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(PineapplePalette.green)
                            .frame(maxWidth: .infinity)
                            .padding(.top, 3)
                    }

                    Text("Dica: cada par tem uma pergunta e sua resposta. As cartas ficam visíveis depois do primeiro toque.")
                        .font(.system(size: 11))
                        .foregroundStyle(PineapplePalette.muted)
                }
            }
            .padding(20)
        }
        .background(PineapplePalette.cream.ignoresSafeArea())
        .navigationTitle("Card Match")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if cards.isEmpty && !store.flashcards.isEmpty {
                startGame()
            }
        }
    }

    private func scoreTile(title: String, value: String, icon: String) -> some View {
        HStack(spacing: 9) {
            Image(systemName: icon)
                .foregroundStyle(PineapplePalette.green)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 10))
                    .foregroundStyle(PineapplePalette.muted)
                Text(value)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(PineapplePalette.ink)
            }
            Spacer(minLength: 0)
        }
        .padding(12)
        .frame(maxWidth: .infinity)
        .background(.white, in: RoundedRectangle(cornerRadius: 13))
    }

    private func matchCardButton(_ card: MatchGameCard) -> some View {
        let isSelected = selectedCardIDs.contains(card.id)
        let isMatched = matchedPairIDs.contains(card.pairID)
        let isVisible = isSelected || isMatched

        return Button {
            flip(card)
        } label: {
            VStack(spacing: 8) {
                if isVisible {
                    Text(card.side == .question ? "PERGUNTA" : "RESPOSTA")
                        .font(.system(size: 9, weight: .bold))
                        .tracking(0.7)
                        .foregroundStyle(PineapplePalette.green)
                    Text(card.text)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(PineapplePalette.ink)
                        .multilineTextAlignment(.center)
                        .lineLimit(5)
                } else {
                    Text("🍍")
                        .font(.system(size: 30))
                    Text("Toque para virar")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundStyle(PineapplePalette.muted)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(minHeight: 112)
            .padding(10)
            .background(
                isMatched ? PineapplePalette.lime.opacity(0.5) : (isVisible ? Color.white : PineapplePalette.green.opacity(0.10)),
                in: RoundedRectangle(cornerRadius: 15)
            )
            .overlay {
                RoundedRectangle(cornerRadius: 15)
                    .stroke(isMatched ? PineapplePalette.green.opacity(0.45) : .clear, lineWidth: 1.5)
            }
        }
        .buttonStyle(.plain)
        .disabled(isVisible || isResolvingMismatch)
        .accessibilityLabel(isVisible ? card.text : "Carta virada")
    }

    private func flip(_ card: MatchGameCard) {
        guard !isResolvingMismatch,
              !selectedCardIDs.contains(card.id),
              !matchedPairIDs.contains(card.pairID),
              selectedCardIDs.count < 2 else { return }

        selectedCardIDs.append(card.id)
        guard selectedCardIDs.count == 2 else { return }

        moves += 1
        let first = cards.first { $0.id == selectedCardIDs[0] }
        let second = cards.first { $0.id == selectedCardIDs[1] }

        if let first, let second,
           first.pairID == second.pairID,
           first.side != second.side {
            matchedPairIDs.insert(first.pairID)
            selectedCardIDs = []
        } else {
            isResolvingMismatch = true
            Task {
                try? await Task.sleep(for: .seconds(0.9))
                selectedCardIDs = []
                isResolvingMismatch = false
            }
        }
    }

    private func startGame() {
        var newCards: [MatchGameCard] = []
        for flashcard in store.flashcards {
            newCards.append(
                MatchGameCard(pairID: flashcard.id, side: .question, text: flashcard.question)
            )
            newCards.append(
                MatchGameCard(pairID: flashcard.id, side: .answer, text: flashcard.answer)
            )
        }
        cards = newCards.shuffled()
        selectedCardIDs = []
        matchedPairIDs = []
        moves = 0
        isResolvingMismatch = false
    }
}
