import SwiftUI

private enum PineapplePalette {
    static let green = Color(red: 0.16, green: 0.38, blue: 0.25)
    static let lime = Color(red: 0.78, green: 0.88, blue: 0.36)
    static let cream = Color(red: 0.98, green: 0.97, blue: 0.93)
    static let ink = Color(red: 0.12, green: 0.16, blue: 0.13)
    static let muted = Color(red: 0.48, green: 0.52, blue: 0.47)
}

private enum AppTab: String, CaseIterable {
    case home = "Início"
    case library = "Biblioteca"
    case create = "Criar"
    case profile = "Perfil"

    var symbol: String {
        switch self {
        case .home: "house.fill"
        case .library: "books.vertical.fill"
        case .create: "plus.circle.fill"
        case .profile: "person.crop.circle.fill"
        }
    }
}

private struct StudyMaterial: Identifiable {
    let id = UUID()
    let title: String
    let subtitle: String
    let icon: String
    let tint: Color
    let progress: String
}

struct ContentView: View {
    @State private var selectedTab: AppTab = .home
    @State private var searchText = ""
    @State private var showingCapture = false
    @State private var showingChat = false

    private let materials = [
        StudyMaterial(title: "Biologia celular", subtitle: "Resumo • 12 páginas", icon: "leaf.fill", tint: Color(red: 0.84, green: 0.91, blue: 0.73), progress: "Há 2 horas"),
        StudyMaterial(title: "Introdução à programação", subtitle: "Transcrição • 38 min", icon: "chevron.left.forwardslash.chevron.right", tint: Color(red: 0.82, green: 0.88, blue: 0.96), progress: "Ontem"),
        StudyMaterial(title: "História do Brasil", subtitle: "Flashcards • 24 cartões", icon: "book.closed.fill", tint: Color(red: 0.97, green: 0.87, blue: 0.72), progress: "22 out.")
    ]

    var body: some View {
        TabView(selection: $selectedTab) {
            homeView
                .tabItem { Label(AppTab.home.rawValue, systemImage: AppTab.home.symbol) }
                .tag(AppTab.home)

            libraryView
                .tabItem { Label(AppTab.library.rawValue, systemImage: AppTab.library.symbol) }
                .tag(AppTab.library)

            createView
                .tabItem { Label(AppTab.create.rawValue, systemImage: AppTab.create.symbol) }
                .tag(AppTab.create)

            profileView
                .tabItem { Label(AppTab.profile.rawValue, systemImage: AppTab.profile.symbol) }
                .tag(AppTab.profile)
        }
        .tint(PineapplePalette.green)
        .sheet(isPresented: $showingCapture) { CaptureSheet() }
        .sheet(isPresented: $showingChat) { StudyChatSheet() }
    }

    private var homeView: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 24) {
                    header
                    welcomeCard
                    quickActions
                    sectionHeader("Continue estudando", action: "Ver biblioteca") {
                        selectedTab = .library
                    }
                    VStack(spacing: 12) {
                        ForEach(materials) { material in
                            MaterialRow(material: material)
                        }
                    }
                    aiCard
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, 28)
            }
            .background(PineapplePalette.cream.ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var header: some View {
        HStack(spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 13).fill(PineapplePalette.green)
                Image(systemName: "sun.max.fill")
                    .font(.system(size: 21, weight: .bold))
                    .foregroundStyle(PineapplePalette.lime)
            }
            .frame(width: 44, height: 44)
            VStack(alignment: .leading, spacing: 1) {
                Text("Pineapple").font(.system(size: 21, weight: .heavy, design: .rounded)).foregroundStyle(PineapplePalette.ink)
                Text("Sua aula. Organizada pela IA.").font(.system(size: 10, weight: .medium)).foregroundStyle(PineapplePalette.muted)
            }
            Spacer()
            Button { showingChat = true } label: {
                Image(systemName: "sparkles").font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(PineapplePalette.green)
                    .frame(width: 42, height: 42)
                    .background(.white, in: Circle())
            }
            .accessibilityLabel("Abrir assistente de IA")
        }
    }

    private var welcomeCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("SEU ESPAÇO DE APRENDIZADO")
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .tracking(1.5)
                .foregroundStyle(PineapplePalette.green.opacity(0.8))
            Text("Aprender fica
mais leve por aqui.")
                .font(.system(size: 29, weight: .bold, design: .rounded))
                .foregroundStyle(PineapplePalette.ink)
            Text("Transforme suas aulas em conhecimento organizado.")
                .font(.system(size: 14))
                .foregroundStyle(PineapplePalette.muted)
            Button { showingCapture = true } label: {
                HStack(spacing: 8) {
                    Image(systemName: "plus")
                    Text("Adicionar material")
                }
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 17)
                .padding(.vertical, 12)
                .background(PineapplePalette.green, in: Capsule())
            }
            .padding(.top, 3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(22)
        .background {
            RoundedRectangle(cornerRadius: 25)
                .fill(PineapplePalette.lime.opacity(0.42))
                .overlay(alignment: .bottomTrailing) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 76, weight: .light))
                        .foregroundStyle(PineapplePalette.green.opacity(0.12))
                        .padding(18)
                }
        }
    }

    private var quickActions: some View {
        VStack(alignment: .leading, spacing: 13) {
            Text("Comece por aqui").font(.system(size: 17, weight: .bold, design: .rounded)).foregroundStyle(PineapplePalette.ink)
            HStack(spacing: 10) {
                QuickAction(title: "Gravar aula", icon: "waveform", tint: Color(red: 0.91, green: 0.83, blue: 0.67)) { showingCapture = true }
                QuickAction(title: "Enviar arquivo", icon: "arrow.up.doc.fill", tint: Color(red: 0.82, green: 0.88, blue: 0.96)) { showingCapture = true }
                QuickAction(title: "Chat IA", icon: "sparkles", tint: Color(red: 0.85, green: 0.90, blue: 0.78)) { showingChat = true }
            }
        }
    }

    private var aiCard: some View {
        Button { showingChat = true } label: {
            HStack(spacing: 14) {
                Image(systemName: "sparkles").font(.system(size: 23, weight: .semibold))
                    .foregroundStyle(PineapplePalette.green)
                    .frame(width: 48, height: 48)
                    .background(PineapplePalette.lime.opacity(0.45), in: RoundedRectangle(cornerRadius: 15))
                VStack(alignment: .leading, spacing: 4) {
                    Text("Seu assistente está pronto").font(.system(size: 14, weight: .bold)).foregroundStyle(PineapplePalette.ink)
                    Text("Tire dúvidas e aprofunde seus estudos.").font(.system(size: 12)).foregroundStyle(PineapplePalette.muted)
                }
                Spacer()
                Image(systemName: "arrow.right").foregroundStyle(PineapplePalette.green)
            }
            .padding(15)
            .background(.white, in: RoundedRectangle(cornerRadius: 19))
        }
        .buttonStyle(.plain)
    }

    private var libraryView: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text("Sua biblioteca").font(.system(size: 29, weight: .bold, design: .rounded))
                    TextField("Buscar materiais", text: $searchText)
                        .padding(13).background(.white, in: RoundedRectangle(cornerRadius: 13))
                    ForEach(materials.filter { searchText.isEmpty || $0.title.localizedCaseInsensitiveContains(searchText) }) { MaterialRow(material: $0) }
                }.padding(20)
            }
            .background(PineapplePalette.cream.ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var createView: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                Text("O que vamos criar?").font(.system(size: 28, weight: .bold, design: .rounded))
                Text("Escolha uma ferramenta para transformar seu material em aprendizado.")
                    .foregroundStyle(PineapplePalette.muted)
                ForEach(["Resumo inteligente", "Flashcards", "Quiz e simulado", "Podcast de estudo", "Apresentação em slides", "Jogo educativo", "Traduzir material"], id: \.self) { item in
                    HStack {
                        Image(systemName: "sparkles").foregroundStyle(PineapplePalette.green)
                        Text(item).fontWeight(.semibold)
                        Spacer()
                        Image(systemName: "chevron.right").foregroundStyle(PineapplePalette.muted)
                    }
                    .padding(16).background(.white, in: RoundedRectangle(cornerRadius: 15))
                }
                Spacer()
            }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
                .background(PineapplePalette.cream.ignoresSafeArea())
                .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var profileView: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                Text("Seu perfil").font(.system(size: 28, weight: .bold, design: .rounded))
                HStack(spacing: 12) {
                    Image(systemName: "person.crop.circle.fill").font(.system(size: 48)).foregroundStyle(PineapplePalette.green)
                    VStack(alignment: .leading) {
                        Text("Estudante Pineapple").fontWeight(.bold)
                        Text("Sua jornada de aprendizado").font(.caption).foregroundStyle(PineapplePalette.muted)
                    }
                }.padding(16).frame(maxWidth: .infinity, alignment: .leading).background(.white, in: RoundedRectangle(cornerRadius: 18))
                Label("Conta e sincronização", systemImage: "person.crop.circle")
                Label("Preferências", systemImage: "slider.horizontal.3")
                Label("Ajuda e suporte", systemImage: "questionmark.circle")
                Label("Pineapple Note • Gratuito", systemImage: "heart.fill").foregroundStyle(PineapplePalette.green)
                Spacer()
            }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
                .background(PineapplePalette.cream.ignoresSafeArea())
                .toolbar(.hidden, for: .navigationBar)
        }
    }

    private func sectionHeader(_ title: String, action: String, onTap: @escaping () -> Void) -> some View {
        HStack {
            Text(title).font(.system(size: 18, weight: .bold, design: .rounded)).foregroundStyle(PineapplePalette.ink)
            Spacer()
            Button(action, action: onTap).font(.system(size: 12, weight: .semibold)).foregroundStyle(PineapplePalette.green)
        }
    }
}

private struct QuickAction: View {
    let title: String
    let icon: String
    let tint: Color
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 13) {
                Image(systemName: icon).font(.system(size: 19, weight: .semibold)).foregroundStyle(PineapplePalette.green)
                    .frame(width: 39, height: 39).background(tint, in: RoundedRectangle(cornerRadius: 12))
                Text(title).font(.system(size: 11, weight: .bold)).foregroundStyle(PineapplePalette.ink)
                    .lineLimit(1).minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(13)
            .background(.white, in: RoundedRectangle(cornerRadius: 17))
        }.buttonStyle(.plain)
    }
}

private struct MaterialRow: View {
    let material: StudyMaterial
    var body: some View {
        HStack(spacing: 13) {
            Image(systemName: material.icon).font(.system(size: 19, weight: .semibold))
                .foregroundStyle(PineapplePalette.green)
                .frame(width: 48, height: 48).background(material.tint, in: RoundedRectangle(cornerRadius: 14))
            VStack(alignment: .leading, spacing: 4) {
                Text(material.title).font(.system(size: 14, weight: .bold)).foregroundStyle(PineapplePalette.ink)
                Text(material.subtitle).font(.system(size: 11)).foregroundStyle(PineapplePalette.muted)
            }
            Spacer()
            Text(material.progress).font(.system(size: 10, weight: .medium)).foregroundStyle(PineapplePalette.muted)
        }
        .padding(12)
        .background(.white, in: RoundedRectangle(cornerRadius: 17))
    }
}

private struct CaptureSheet: View {
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            VStack(spacing: 18) {
                Image(systemName: "doc.badge.plus").font(.system(size: 42)).foregroundStyle(PineapplePalette.green)
                Text("Adicione seu material").font(.system(size: 22, weight: .bold, design: .rounded))
                Text("Em breve você poderá gravar aulas ou importar PDFs, áudios, vídeos e documentos por aqui.")
                    .multilineTextAlignment(.center).foregroundStyle(PineapplePalette.muted)
                Button("Entendi") { dismiss() }
                    .fontWeight(.bold).foregroundStyle(.white).padding(.horizontal, 28).padding(.vertical, 13)
                    .background(PineapplePalette.green, in: Capsule())
                Spacer()
            }.padding(28).padding(.top, 24)
                .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Fechar") { dismiss() } } }
        }
    }
}

private struct StudyChatSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var question = ""
    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Image(systemName: "sparkles").font(.system(size: 38)).foregroundStyle(PineapplePalette.green)
                Text("Chat de estudos").font(.system(size: 23, weight: .bold, design: .rounded))
                Text("Converse com a IA sobre seus materiais, tire dúvidas e peça explicações.")
                    .multilineTextAlignment(.center).foregroundStyle(PineapplePalette.muted)
                Spacer()
                HStack {
                    TextField("Digite sua pergunta...", text: $question)
                    Button {} label: { Image(systemName: "arrow.up.circle.fill").font(.system(size: 28)).foregroundStyle(PineapplePalette.green) }
                }.padding(12).background(PineapplePalette.cream, in: RoundedRectangle(cornerRadius: 15))
            }.padding(22)
                .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Fechar") { dismiss() } } }
        }
    }
}

#Preview {
    ContentView()
}
