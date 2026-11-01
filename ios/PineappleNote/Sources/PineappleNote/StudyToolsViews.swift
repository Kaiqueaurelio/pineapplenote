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
                        StudyMaterialsView(store: store)
                    } label: {
                        ToolCard(
                            title: "Materiais e arquivos",
                            subtitle: "\(store.materials.count) arquivos • PDF, áudio, vídeo e documentos",
                            icon: "folder.fill",
                            tint: Color(red: 0.91, green: 0.83, blue: 0.67)
                        )
                    }
                    .buttonStyle(.plain)

                    NavigationLink {
                        FlashcardsView(store: store)
                    } label: {
                        ToolCard(
                            title: "Flashcards",
                            subtitle: "\(store.flashcards.count) cartões • pergunta, resposta e revisão",
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
                            subtitle: "\(store.questions.count) questões • correção e pontuação",
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

                    Text("Materiais, flashcards e simulados funcionam localmente. Resumos e chat serão conectados ao servidor seguro; nenhuma chave de IA ficará no iPhone.")
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
