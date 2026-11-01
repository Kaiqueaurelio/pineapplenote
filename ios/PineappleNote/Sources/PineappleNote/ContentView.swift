import SwiftUI

enum PineapplePalette {
    static let green = Color(red: 0.16, green: 0.38, blue: 0.25)
    static let lime = Color(red: 0.78, green: 0.88, blue: 0.36)
    static let cream = Color(red: 0.98, green: 0.97, blue: 0.93)
    static let ink = Color(red: 0.12, green: 0.16, blue: 0.13)
    static let muted = Color(red: 0.48, green: 0.52, blue: 0.47)
}

private enum AppTab: String {
    case home = "Início"
    case library = "Biblioteca"
    case study = "Estudar"
    case profile = "Perfil"

    var symbol: String {
        switch self {
        case .home: "house.fill"
        case .library: "books.vertical.fill"
        case .study: "sparkles"
        case .profile: "person.crop.circle.fill"
        }
    }
}

struct ContentView: View {
    @StateObject private var store = StudyStore()
    @State private var selectedTab: AppTab = .home
    @State private var searchText = ""
    @State private var editingNote: StudyNote?
    @State private var showingNoteEditor = false
    @State private var showingAssistantInfo = false

    private var filteredNotes: [StudyNote] {
        guard !searchText.isEmpty else { return store.notes }
        return store.notes.filter {
            $0.title.localizedCaseInsensitiveContains(searchText) ||
            $0.body.localizedCaseInsensitiveContains(searchText) ||
            $0.subject.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            homeView
                .tabItem { Label(AppTab.home.rawValue, systemImage: AppTab.home.symbol) }
                .tag(AppTab.home)
            libraryView
                .tabItem { Label(AppTab.library.rawValue, systemImage: AppTab.library.symbol) }
                .tag(AppTab.library)
            StudyToolsView(store: store)
                .tabItem { Label(AppTab.study.rawValue, systemImage: AppTab.study.symbol) }
                .tag(AppTab.study)
            profileView
                .tabItem { Label(AppTab.profile.rawValue, systemImage: AppTab.profile.symbol) }
                .tag(AppTab.profile)
        }
        .tint(PineapplePalette.green)
        .sheet(isPresented: $showingNoteEditor) {
            NoteEditorSheet(note: editingNote) { store.save($0) }
        }
        .alert("Assistente Pineapple", isPresented: $showingAssistantInfo) {
            Button("Entendi", role: .cancel) {}
        } message: {
            Text("O assistente de IA será conectado ao backend seguro do Pineapple Note em uma próxima etapa. Suas chaves de API não ficarão dentro do aplicativo.")
        }
    }

    private var homeView: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 23) {
                    header
                    welcomeCard
                    quickActions
                    HStack {
                        Text("Suas anotações")
                            .font(.system(size: 18, weight: .bold, design: .rounded))
                        Spacer()
                        Button("Ver todas") { selectedTab = .library }
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(PineapplePalette.green)
                    }

                    if store.notes.isEmpty {
                        emptyNotesState
                    } else {
                        VStack(spacing: 11) {
                            ForEach(store.notes.prefix(4)) { note in
                                NoteRow(note: note) { open(note) }
                                    .contextMenu {
                                        Button(role: .destructive) { store.delete(note) } label: {
                                            Label("Excluir anotação", systemImage: "trash")
                                        }
                                    }
                            }
                        }
                    }

                    assistantCard
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
            Button { showingAssistantInfo = true } label: {
                Image(systemName: "sparkles")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(PineapplePalette.green)
                    .frame(width: 42, height: 42)
                    .background(.white, in: Circle())
            }
            .accessibilityLabel("Assistente de IA")
        }
    }

    private var welcomeCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("SEU ESPAÇO DE APRENDIZADO")
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .tracking(1.5)
                .foregroundStyle(PineapplePalette.green.opacity(0.8))
            Text("Aprender fica\nmais leve por aqui.")
                .font(.system(size: 29, weight: .bold, design: .rounded))
                .foregroundStyle(PineapplePalette.ink)
            Text("Suas ideias e materiais organizados em um só lugar.")
                .font(.system(size: 14))
                .foregroundStyle(PineapplePalette.muted)
            Button { createNote() } label: {
                Label("Nova anotação", systemImage: "plus")
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
            Text("Acesso rápido").font(.system(size: 17, weight: .bold, design: .rounded))
            HStack(spacing: 10) {
                QuickAction(title: "Anotação", icon: "square.and.pencil", tint: Color(red: 0.91, green: 0.83, blue: 0.67)) { createNote() }
                QuickAction(title: "Flashcards", icon: "rectangle.on.rectangle.angled", tint: Color(red: 0.82, green: 0.88, blue: 0.96)) { selectedTab = .study }
                QuickAction(title: "Arquivos", icon: "doc.fill", tint: Color(red: 0.85, green: 0.90, blue: 0.78)) { selectedTab = .library }
            }
        }
    }

    private var libraryView: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 17) {
                    Text("Sua biblioteca")
                        .font(.system(size: 29, weight: .bold, design: .rounded))
                        .foregroundStyle(PineapplePalette.ink)

                    NavigationLink {
                        StudyMaterialsView(store: store)
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: "folder.fill")
                                .font(.system(size: 19, weight: .semibold))
                                .foregroundStyle(PineapplePalette.green)
                                .frame(width: 44, height: 44)
                                .background(PineapplePalette.lime.opacity(0.4), in: RoundedRectangle(cornerRadius: 12))
                            VStack(alignment: .leading, spacing: 3) {
                                Text("Arquivos e materiais")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(PineapplePalette.ink)
                                Text("\(store.materials.count) arquivos salvos neste iPhone")
                                    .font(.system(size: 11))
                                    .foregroundStyle(PineapplePalette.muted)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(PineapplePalette.muted)
                        }
                        .padding(12)
                        .background(.white, in: RoundedRectangle(cornerRadius: 16))
                    }
                    .buttonStyle(.plain)

                    TextField("Buscar anotações", text: $searchText)
                        .textInputAutocapitalization(.never)
                        .padding(13)
                        .background(.white, in: RoundedRectangle(cornerRadius: 13))

                    HStack {
                        Text("\(filteredNotes.count) anotações")
                            .font(.caption)
                            .foregroundStyle(PineapplePalette.muted)
                        Spacer()
                        Button { createNote() } label: {
                            Label("Adicionar", systemImage: "plus")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(PineapplePalette.green)
                        }
                    }

                    if filteredNotes.isEmpty {
                        emptyNotesState
                    } else {
                        ForEach(filteredNotes) { note in
                            NoteRow(note: note) { open(note) }
                                .contextMenu {
                                    Button(role: .destructive) { store.delete(note) } label: {
                                        Label("Excluir", systemImage: "trash")
                                    }
                                }
                        }
                    }

                    Text("As anotações e os arquivos importados ficam disponíveis offline. A sincronização em nuvem será adicionada após confirmar o projeto Supabase correto.")
                        .font(.system(size: 11))
                        .foregroundStyle(PineapplePalette.muted)
                }
                .padding(20)
            }
            .background(PineapplePalette.cream.ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var profileView: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                Text("Seu perfil").font(.system(size: 28, weight: .bold, design: .rounded))
                HStack(spacing: 12) {
                    Image(systemName: "person.crop.circle.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(PineapplePalette.green)
                    VStack(alignment: .leading) {
                        Text("Estudante Pineapple").fontWeight(.bold)
                        Text("Sua jornada de aprendizado").font(.caption).foregroundStyle(PineapplePalette.muted)
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(.white, in: RoundedRectangle(cornerRadius: 18))
                Label("Anotações: \(store.notes.count)", systemImage: "note.text")
                Label("Arquivos: \(store.materials.count)", systemImage: "folder")
                Label("Flashcards: \(store.flashcards.count)", systemImage: "rectangle.on.rectangle")
                Label("Questões: \(store.questions.count)", systemImage: "checkmark.circle")
                NavigationLink {
                    StudyBackupView(store: store)
                } label: {
                    Label("Backup e restauração", systemImage: "externaldrive.fill")
                        .foregroundStyle(PineapplePalette.green)
                }
                                Label("Sincronização em nuvem: em desenvolvimento", systemImage: "icloud")
                Label("Pineapple Note • Gratuito", systemImage: "heart.fill").foregroundStyle(PineapplePalette.green)
                Text("O Pineapple Note não terá assinatura obrigatória nem bloqueio de funcionalidades por plano.")
                    .font(.system(size: 12))
                    .foregroundStyle(PineapplePalette.muted)
                Spacer()
            }
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(PineapplePalette.cream.ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var assistantCard: some View {
        Button { showingAssistantInfo = true } label: {
            HStack(spacing: 14) {
                Image(systemName: "sparkles")
                    .font(.system(size: 23, weight: .semibold))
                    .foregroundStyle(PineapplePalette.green)
                    .frame(width: 48, height: 48)
                    .background(PineapplePalette.lime.opacity(0.45), in: RoundedRectangle(cornerRadius: 15))
                VStack(alignment: .leading, spacing: 4) {
                    Text("Estude com inteligência").font(.system(size: 14, weight: .bold)).foregroundStyle(PineapplePalette.ink)
                    Text("O assistente de IA será integrado ao seu conteúdo.").font(.system(size: 12)).foregroundStyle(PineapplePalette.muted)
                }
                Spacer()
                Image(systemName: "arrow.right").foregroundStyle(PineapplePalette.green)
            }
            .padding(15)
            .background(.white, in: RoundedRectangle(cornerRadius: 19))
        }
        .buttonStyle(.plain)
    }

    private var emptyNotesState: some View {
        VStack(spacing: 10) {
            Image(systemName: "note.text").font(.system(size: 32)).foregroundStyle(PineapplePalette.green)
            Text("Sua biblioteca está esperando").font(.system(size: 15, weight: .bold))
            Text("Crie uma anotação para começar a organizar seus estudos.")
                .font(.system(size: 12))
                .foregroundStyle(PineapplePalette.muted)
                .multilineTextAlignment(.center)
            Button("Criar anotação") { createNote() }
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(PineapplePalette.green, in: Capsule())
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .background(.white, in: RoundedRectangle(cornerRadius: 18))
    }

    private func createNote() {
        editingNote = nil
        showingNoteEditor = true
    }

    private func open(_ note: StudyNote) {
        editingNote = note
        showingNoteEditor = true
    }
}

private struct NoteEditorSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var title: String
    @State private var bodyText: String
    @State private var subject: String
    let existingNote: StudyNote?
    let onSave: (StudyNote) -> Void

    init(note: StudyNote?, onSave: @escaping (StudyNote) -> Void) {
        existingNote = note
        self.onSave = onSave
        _title = State(initialValue: note?.title ?? "")
        _bodyText = State(initialValue: note?.body ?? "")
        _subject = State(initialValue: note?.subject ?? "Geral")
    }

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 15) {
                TextField("Título da anotação", text: $title)
                    .font(.system(size: 23, weight: .bold, design: .rounded))
                TextField("Matéria ou categoria", text: $subject)
                    .font(.system(size: 13, weight: .medium))
                    .padding(11)
                    .background(PineapplePalette.cream, in: RoundedRectangle(cornerRadius: 10))
                TextEditor(text: $bodyText)
                    .scrollContentBackground(.hidden)
                    .padding(8)
                    .background(PineapplePalette.cream, in: RoundedRectangle(cornerRadius: 14))
                    .overlay(alignment: .topLeading) {
                        if bodyText.isEmpty {
                            Text("Escreva suas ideias, conceitos e pontos importantes...")
                                .font(.system(size: 15))
                                .foregroundStyle(.secondary)
                                .padding(.horizontal, 13)
                                .padding(.vertical, 16)
                                .allowsHitTesting(false)
                        }
                    }
                Spacer(minLength: 0)
            }
            .padding(20)
            .background(.white)
            .navigationTitle(existingNote == nil ? "Nova anotação" : "Editar anotação")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Salvar") {
                        let cleanTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
                        guard !cleanTitle.isEmpty else { return }
                        let cleanSubject = subject.trimmingCharacters(in: .whitespacesAndNewlines)
                        onSave(StudyNote(
                            id: existingNote?.id ?? UUID(),
                            title: cleanTitle,
                            body: bodyText,
                            subject: cleanSubject.isEmpty ? "Geral" : cleanSubject,
                            updatedAt: .now
                        ))
                        dismiss()
                    }
                    .fontWeight(.bold)
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}

private struct NoteRow: View {
    let note: StudyNote
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 13) {
                Image(systemName: "note.text")
                    .font(.system(size: 19, weight: .semibold))
                    .foregroundStyle(PineapplePalette.green)
                    .frame(width: 47, height: 47)
                    .background(PineapplePalette.lime.opacity(0.38), in: RoundedRectangle(cornerRadius: 14))
                VStack(alignment: .leading, spacing: 4) {
                    Text(note.title).font(.system(size: 14, weight: .bold)).foregroundStyle(PineapplePalette.ink).lineLimit(1)
                    Text(note.preview).font(.system(size: 11)).foregroundStyle(PineapplePalette.muted).lineLimit(2)
                    Text(note.subject.uppercased()).font(.system(size: 9, weight: .bold)).tracking(0.8).foregroundStyle(PineapplePalette.green)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").font(.system(size: 11, weight: .semibold)).foregroundStyle(PineapplePalette.muted)
            }
            .padding(12)
            .background(.white, in: RoundedRectangle(cornerRadius: 17))
        }
        .buttonStyle(.plain)
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
                Image(systemName: icon)
                    .font(.system(size: 19, weight: .semibold))
                    .foregroundStyle(PineapplePalette.green)
                    .frame(width: 39, height: 39)
                    .background(tint, in: RoundedRectangle(cornerRadius: 12))
                Text(title).font(.system(size: 11, weight: .bold)).foregroundStyle(PineapplePalette.ink).lineLimit(1).minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(13)
            .background(.white, in: RoundedRectangle(cornerRadius: 17))
        }
        .buttonStyle(.plain)
    }
}
