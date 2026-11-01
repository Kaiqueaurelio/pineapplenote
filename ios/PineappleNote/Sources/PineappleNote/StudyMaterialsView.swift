import SwiftUI
import QuickLook
import UniformTypeIdentifiers

struct StudyMaterialsView: View {
    @ObservedObject var store: StudyStore
    @State private var showingImporter = false
    @State private var previewURL: URL?
    @State private var importError: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Arquivos e materiais")
                            .font(.system(size: 25, weight: .bold, design: .rounded))
                        Text("Salvos localmente neste iPhone")
                            .font(.system(size: 12))
                            .foregroundStyle(PineapplePalette.muted)
                    }
                    Spacer()
                    NavigationLink {
                    StudyRecorderView(store: store)
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "mic.fill")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(PineapplePalette.green)
                            .frame(width: 43, height: 43)
                            .background(PineapplePalette.lime.opacity(0.38), in: RoundedRectangle(cornerRadius: 12))
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Gravar uma aula")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(PineapplePalette.ink)
                            Text("Grave e salve o áudio neste iPhone")
                                .font(.system(size: 11))
                                .foregroundStyle(PineapplePalette.muted)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(PineapplePalette.muted)
                    }
                    .padding(12)
                    .background(.white, in: RoundedRectangle(cornerRadius: 15))
                }
                .buttonStyle(.plain)

                Button { showingImporter = true } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 40, height: 40)
                            .background(PineapplePalette.green, in: Circle())
                    }
                    .accessibilityLabel("Importar arquivo")
                }

                Button { showingImporter = true } label: {
                    VStack(spacing: 9) {
                        Image(systemName: "square.and.arrow.down")
                            .font(.system(size: 27, weight: .semibold))
                            .foregroundStyle(PineapplePalette.green)
                        Text("Importar materiais")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(PineapplePalette.ink)
                        Text("PDF, Word, planilhas, apresentações, áudio, vídeo e imagens")
                            .font(.system(size: 11))
                            .foregroundStyle(PineapplePalette.muted)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(24)
                    .background(PineapplePalette.lime.opacity(0.28), in: RoundedRectangle(cornerRadius: 18))
                }
                .buttonStyle(.plain)

                if store.materials.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "folder")
                            .font(.system(size: 31))
                            .foregroundStyle(PineapplePalette.green)
                        Text("Nenhum arquivo importado")
                            .font(.system(size: 14, weight: .bold))
                        Text("Adicione seus materiais para acessá-los mesmo sem conexão.")
                            .font(.system(size: 11))
                            .foregroundStyle(PineapplePalette.muted)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(22)
                    .background(.white, in: RoundedRectangle(cornerRadius: 17))
                } else {
                    Text("\(store.materials.count) arquivos")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(PineapplePalette.muted)

                    ForEach(store.materials) { material in
                        Button {
                            guard let url = store.localURL(for: material),
                                  FileManager.default.fileExists(atPath: url.path) else {
                                importError = "Este arquivo não foi encontrado no armazenamento local."
                                return
                            }
                            previewURL = url
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: material.kind.symbol)
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundStyle(PineapplePalette.green)
                                    .frame(width: 43, height: 43)
                                    .background(PineapplePalette.lime.opacity(0.38), in: RoundedRectangle(cornerRadius: 12))
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(material.name)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundStyle(PineapplePalette.ink)
                                        .lineLimit(2)
                                        .multilineTextAlignment(.leading)
                                    Text("\(material.kind.title) • \(ByteCountFormatter.string(fromByteCount: material.sizeInBytes, countStyle: .file))")
                                        .font(.system(size: 10))
                                        .foregroundStyle(PineapplePalette.muted)
                                }
                                Spacer()
                                Image(systemName: "arrow.up.right")
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundStyle(PineapplePalette.muted)
                            }
                            .padding(12)
                            .background(.white, in: RoundedRectangle(cornerRadius: 15))
                        }
                        .buttonStyle(.plain)
                        .contextMenu {
                            Button(role: .destructive) {
                                store.delete(material)
                            } label: {
                                Label("Excluir arquivo", systemImage: "trash")
                            }
                        }
                    }
                }

                Text("Os arquivos são copiados para o armazenamento privado do aplicativo. A pré-visualização depende do suporte do iOS ao formato. Nesta versão, importação e abertura são locais; envio para a nuvem, transcrição e geração automática de conteúdo ainda serão integrados.")
                    .font(.system(size: 11))
                    .foregroundStyle(PineapplePalette.muted)
            }
            .padding(20)
        }
        .background(PineapplePalette.cream.ignoresSafeArea())
        .navigationTitle("Materiais")
        .navigationBarTitleDisplayMode(.inline)
        .fileImporter(
            isPresented: $showingImporter,
            allowedContentTypes: [.pdf, .audio, .movie, .image, .text, .item],
            allowsMultipleSelection: true
        ) { result in
            switch result {
            case .success(let urls):
                for url in urls {
                    do {
                        try store.importMaterial(from: url)
                    } catch {
                        importError = "Não foi possível importar \(url.lastPathComponent): \(error.localizedDescription)"
                        break
                    }
                }
            case .failure(let error):
                importError = error.localizedDescription
            }
        }
        .quickLookPreview($previewURL)
        .alert("Não foi possível abrir ou importar", isPresented: Binding(
            get: { importError != nil },
            set: { if !$0 { importError = nil } }
        )) {
            Button("OK", role: .cancel) { importError = nil }
        } message: {
            Text(importError ?? "Ocorreu um erro desconhecido.")
        }
    }
}
