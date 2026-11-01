import SwiftUI
import UniformTypeIdentifiers

struct StudyBackupDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    var data: Data

    init(data: Data) {
        self.data = data
    }

    init(configuration: ReadConfiguration) throws {
        guard let contents = configuration.file.regularFileContents else {
            throw CocoaError(.fileReadCorruptFile)
        }
        data = contents
    }

    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        FileWrapper(regularFileWithContents: data)
    }
}

struct StudyBackupView: View {
    @ObservedObject var store: StudyStore
    @State private var exportDocument = StudyBackupDocument(data: Data())
    @State private var isExporting = false
    @State private var isImporting = false
    @State private var alertTitle = ""
    @State private var alertMessage = ""
    @State private var showingAlert = false

    private var fileName: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return "pineapple-backup-\(formatter.string(from: .now))"
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                VStack(alignment: .leading, spacing: 7) {
                    Text("Backup dos seus estudos")
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundStyle(PineapplePalette.ink)
                    Text("Guarde uma cópia das suas anotações e materiais de revisão para restaurar em outro momento.")
                        .font(.system(size: 13))
                        .foregroundStyle(PineapplePalette.muted)
                }

                VStack(spacing: 11) {
                    backupRow("Anotações", count: store.notes.count, icon: "note.text")
                    backupRow("Flashcards", count: store.flashcards.count, icon: "rectangle.on.rectangle")
                    backupRow("Questões", count: store.questions.count, icon: "checkmark.circle")
                    backupRow("Tentativas de simulado", count: store.quizAttempts.count, icon: "chart.bar.fill")
                }
                .padding(15)
                .background(.white, in: RoundedRectangle(cornerRadius: 17))

                Button(action: exportBackup) {
                    Label("Exportar backup JSON", systemImage: "square.and.arrow.up")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(PineapplePalette.green, in: Capsule())
                }

                Button { isImporting = true } label: {
                    Label("Restaurar de um arquivo JSON", systemImage: "square.and.arrow.down")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(PineapplePalette.green)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(PineapplePalette.lime.opacity(0.34), in: Capsule())
                }

                VStack(alignment: .leading, spacing: 8) {
                    Label("Como funciona", systemImage: "info.circle.fill")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(PineapplePalette.green)
                    Text("O backup inclui anotações, flashcards, questões e histórico de simulados. A restauração mescla os itens pelo identificador, evitando duplicar os que já existem. Os arquivos PDF, áudios, vídeos e imagens não são incluídos; eles permanecem na biblioteca local do aparelho.")
                        .font(.system(size: 11))
                        .foregroundStyle(PineapplePalette.muted)
                    Text("O arquivo é gerado no próprio iPhone. Você escolhe onde salvá-lo ou de onde importá-lo.")
                        .font(.system(size: 11))
                        .foregroundStyle(PineapplePalette.muted)
                }
                .padding(15)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(.white, in: RoundedRectangle(cornerRadius: 17))
            }
            .padding(20)
        }
        .background(PineapplePalette.cream.ignoresSafeArea())
        .navigationTitle("Backup")
        .navigationBarTitleDisplayMode(.inline)
        .fileExporter(
            isPresented: $isExporting,
            document: exportDocument,
            contentType: .json,
            defaultFilename: fileName
        ) { result in
            switch result {
            case .success:
                alertTitle = "Backup exportado"
                alertMessage = "Sua cópia JSON foi salva no local escolhido."
            case .failure(let error):
                alertTitle = "Falha ao exportar"
                alertMessage = error.localizedDescription
            }
            showingAlert = true
        }
        .fileImporter(
            isPresented: $isImporting,
            allowedContentTypes: [.json],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                guard let url = urls.first else { return }
                let didStartAccess = url.startAccessingSecurityScopedResource()
                defer {
                    if didStartAccess { url.stopAccessingSecurityScopedResource() }
                }
                do {
                    let data = try Data(contentsOf: url)
                    try store.restoreBackup(from: data)
                    alertTitle = "Backup restaurado"
                    alertMessage = "Os itens compatíveis foram mesclados com seus dados locais."
                } catch {
                    alertTitle = "Falha ao restaurar"
                    alertMessage = error.localizedDescription
                }
            case .failure(let error):
                alertTitle = "Falha ao abrir o backup"
                alertMessage = error.localizedDescription
            }
            showingAlert = true
        }
        .alert(alertTitle, isPresented: $showingAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(alertMessage)
        }
    }

    private func backupRow(_ title: String, count: Int, icon: String) -> some View {
        HStack {
            Image(systemName: icon)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(PineapplePalette.green)
                .frame(width: 34, height: 34)
                .background(PineapplePalette.lime.opacity(0.4), in: RoundedRectangle(cornerRadius: 10))
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(PineapplePalette.ink)
            Spacer()
            Text("\(count)")
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(PineapplePalette.green)
        }
    }

    private func exportBackup() {
        do {
            exportDocument = StudyBackupDocument(data: try store.makeBackupData())
            isExporting = true
        } catch {
            alertTitle = "Falha ao preparar backup"
            alertMessage = error.localizedDescription
            showingAlert = true
        }
    }
}
