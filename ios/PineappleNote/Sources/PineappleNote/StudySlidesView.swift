import SwiftUI
import UniformTypeIdentifiers

private struct StudySlide: Identifiable {
    let id = UUID()
    let title: String
    let body: String
    let takeaway: String
}

private enum StudySlideStyle: String, CaseIterable, Identifiable {
    case pineapple
    case violet
    case paper
    case dark

    var id: String { rawValue }

    var name: String {
        switch self {
        case .pineapple: "Pineapple Clean"
        case .violet: "Pineapple Focus"
        case .paper: "Papel de estudo"
        case .dark: "Pineapple Night"
        }
    }

    var description: String {
        switch self {
        case .pineapple: "Clareza e blocos limpos."
        case .violet: "Contraste para conceitos-chave."
        case .paper: "Visual editorial para teoria."
        case .dark: "Fundo escuro para apresentação."
        }
    }

    var backgroundColor: String {
        switch self {
        case .pineapple: "#F7F7ED"
        case .violet: "#F2EEFA"
        case .paper: "#F6EBCB"
        case .dark: "#17251F"
        }
    }

    var cardColor: String {
        switch self {
        case .pineapple: "#FFFFFF"
        case .violet: "#FFFFFF"
        case .paper: "#FFFDF5"
        case .dark: "#263A31"
        }
    }

    var textColor: String {
        switch self {
        case .pineapple: "#17251F"
        case .violet: "#241C35"
        case .paper: "#3B3022"
        case .dark: "#F7F7ED"
        }
    }

    var accentColor: String {
        switch self {
        case .pineapple: "#286044"
        case .violet: "#7654B7"
        case .paper: "#A06A28"
        case .dark: "#B8D86B"
        }
    }
}

private struct StudySlidesDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.html] }
    let data: Data

    init(data: Data) {
        self.data = data
    }

    init(configuration: ReadConfiguration) throws {
        guard let data = configuration.file.regularFileContents else {
            throw CocoaError(.fileReadCorruptFile)
        }
        self.data = data
    }

    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        FileWrapper(regularFileWithContents: data)
    }
}

struct StudySlidesView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var store: StudyStore
    @State private var selectedNoteID: UUID?
    @State private var selectedStyle: StudySlideStyle = .pineapple
    @State private var instructions = ""
    @State private var exportDocument = StudySlidesDocument(data: Data())
    @State private var isExporting = false
    @State private var alertTitle = ""
    @State private var alertMessage = ""
    @State private var showingAlert = false

    private var selectedNote: StudyNote? {
        if let selectedNoteID {
            return store.notes.first { $0.id == selectedNoteID }
        }
        return store.notes.first
    }

    private var slides: [StudySlide] {
        guard let note = selectedNote else { return [] }
        return buildSlides(from: note)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                VStack(alignment: .leading, spacing: 5) {
                    Text("Criar apresentação")
                        .font(.system(size: 27, weight: .bold, design: .rounded))
                        .foregroundStyle(PineapplePalette.ink)
                    Text("Monte uma sequência de slides a partir das suas anotações, mesmo sem internet.")
                        .font(.system(size: 12))
                        .foregroundStyle(PineapplePalette.muted)
                }

                if store.notes.isEmpty {
                    EmptyStudyState(
                        icon: "rectangle.on.rectangle",
                        title: "Nenhuma anotação disponível",
                        message: "Crie uma anotação para montar sua apresentação.",
                        actionTitle: "Voltar às ferramentas"
                    ) { dismiss() }
                } else {
                    VStack(alignment: .leading, spacing: 9) {
                        Text("Material de origem")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(PineapplePalette.ink)
                        ForEach(store.notes) { note in
                            Button {
                                selectedNoteID = note.id
                            } label: {
                                HStack(spacing: 10) {
                                    Image(systemName: "note.text")
                                        .foregroundStyle(PineapplePalette.green)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(note.title)
                                            .font(.system(size: 13, weight: .semibold))
                                            .foregroundStyle(PineapplePalette.ink)
                                        Text(note.subject)
                                            .font(.system(size: 10))
                                            .foregroundStyle(PineapplePalette.muted)
                                    }
                                    Spacer()
                                    if selectedNote?.id == note.id {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundStyle(PineapplePalette.green)
                                    }
                                }
                                .padding(11)
                                .background(.white, in: RoundedRectangle(cornerRadius: 12))
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Text("Escolha um estilo")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(PineapplePalette.ink)
                        ForEach(StudySlideStyle.allCases) { style in
                            Button {
                                selectedStyle = style
                            } label: {
                                HStack(spacing: 11) {
                                    RoundedRectangle(cornerRadius: 9)
                                        .fill(Color(hex: style.backgroundColor))
                                        .frame(width: 54, height: 42)
                                        .overlay {
                                            VStack(spacing: 4) {
                                                RoundedRectangle(cornerRadius: 2)
                                                    .fill(Color(hex: style.accentColor))
                                                    .frame(width: 25, height: 4)
                                                RoundedRectangle(cornerRadius: 2)
                                                    .fill(Color(hex: style.textColor).opacity(0.25))
                                                    .frame(width: 32, height: 3)
                                            }
                                        }
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(style.name)
                                            .font(.system(size: 12, weight: .bold))
                                            .foregroundStyle(PineapplePalette.ink)
                                        Text(style.description)
                                            .font(.system(size: 10))
                                            .foregroundStyle(PineapplePalette.muted)
                                    }
                                    Spacer()
                                    Image(systemName: selectedStyle == style ? "checkmark.circle.fill" : "circle")
                                        .foregroundStyle(PineapplePalette.green)
                                }
                                .padding(10)
                                .background(.white, in: RoundedRectangle(cornerRadius: 13))
                                .overlay {
                                    RoundedRectangle(cornerRadius: 13)
                                        .stroke(selectedStyle == style ? PineapplePalette.green : .clear, lineWidth: 1.5)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    VStack(alignment: .leading, spacing: 7) {
                        Text("Orientação para a apresentação (opcional)")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(PineapplePalette.ink)
                        TextField("Ex.: destaque fórmulas e exemplos práticos", text: $instructions, axis: .vertical)
                            .lineLimit(2...4)
                            .font(.system(size: 12))
                            .padding(12)
                            .background(.white, in: RoundedRectangle(cornerRadius: 12))
                    }

                    VStack(alignment: .leading, spacing: 11) {
                        HStack {
                            VStack(alignment: .leading, spacing: 3) {
                                Text("Prévia da apresentação")
                                    .font(.system(size: 16, weight: .bold, design: .rounded))
                                    .foregroundStyle(PineapplePalette.ink)
                                Text("\(slides.count) slides • gerados localmente")
                                    .font(.system(size: 10))
                                    .foregroundStyle(PineapplePalette.muted)
                            }
                            Spacer()
                            Image(systemName: "rectangle.on.rectangle")
                                .foregroundStyle(PineapplePalette.green)
                        }

                        ForEach(Array(slides.enumerated()), id: \.element.id) { index, slide in
                            VStack(alignment: .leading, spacing: 9) {
                                Text("SLIDE \(index + 1) • PINEAPPLE NOTE")
                                    .font(.system(size: 9, weight: .bold))
                                    .tracking(0.8)
                                    .foregroundStyle(Color(hex: selectedStyle.accentColor))
                                Text(slide.title)
                                    .font(.system(size: 18, weight: .bold, design: .rounded))
                                    .foregroundStyle(Color(hex: selectedStyle.textColor))
                                Text(slide.body)
                                    .font(.system(size: 12))
                                    .foregroundStyle(Color(hex: selectedStyle.textColor).opacity(0.8))
                                Text(slide.takeaway)
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(Color(hex: selectedStyle.accentColor))
                                    .padding(10)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color(hex: selectedStyle.accentColor).opacity(0.10), in: RoundedRectangle(cornerRadius: 9))
                            }
                            .padding(15)
                            .frame(maxWidth: .infinity, minHeight: 170, alignment: .leading)
                            .background(Color(hex: selectedStyle.backgroundColor), in: RoundedRectangle(cornerRadius: 16))
                            .overlay {
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color(hex: selectedStyle.accentColor).opacity(0.18), lineWidth: 1)
                            }
                        }
                    }

                    Button(action: exportSlides) {
                        Label("Exportar apresentação HTML", systemImage: "square.and.arrow.up")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 15)
                            .background(PineapplePalette.green, in: Capsule())
                    }
                    .disabled(slides.isEmpty)
                }

                Text("A versão offline organiza o texto em slides e exporta um arquivo HTML que pode ser aberto no navegador. A geração de apresentações por IA será conectada ao servidor quando o backend original estiver acessível.")
                    .font(.system(size: 11))
                    .foregroundStyle(PineapplePalette.muted)
            }
            .padding(20)
        }
        .background(PineapplePalette.cream.ignoresSafeArea())
        .navigationTitle("Criar slides")
        .navigationBarTitleDisplayMode(.inline)
        .fileExporter(
            isPresented: $isExporting,
            document: exportDocument,
            contentType: .html,
            defaultFilename: "pineapple-slides"
        ) { result in
            switch result {
            case .success:
                alertTitle = "Apresentação exportada"
                alertMessage = "O arquivo HTML foi salvo no local escolhido."
            case .failure(let error):
                alertTitle = "Falha ao exportar"
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

    private func buildSlides(from note: StudyNote) -> [StudySlide] {
        let paragraphs = note.body
            .components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        var result = [
            StudySlide(
                title: note.title,
                body: note.preview,
                takeaway: "Matéria: \(note.subject)"
            )
        ]

        if !paragraphs.isEmpty {
            let chunks = stride(from: 0, to: paragraphs.count, by: 2).map { start in
                Array(paragraphs[start..<min(start + 2, paragraphs.count)])
            }
            for (index, chunk) in chunks.enumerated() {
                let body = chunk.joined(separator: "\n\n")
                let firstLine = chunk[0]
                let title = firstLine.count > 48
                    ? String(firstLine.prefix(45)) + "..."
                    : firstLine
                let takeaway = firstLine.count > 120
                    ? String(firstLine.prefix(117)) + "..."
                    : "Ideia-chave: \(firstLine)"
                result.append(
                    StudySlide(
                        title: title.isEmpty ? "Ponto \(index + 1)" : title,
                        body: body,
                        takeaway: takeaway
                    )
                )
            }
        }

        let cleanInstructions = instructions.trimmingCharacters(in: .whitespacesAndNewlines)
        if !cleanInstructions.isEmpty {
            result.append(
                StudySlide(
                    title: "Orientação para apresentar",
                    body: cleanInstructions,
                    takeaway: "Personalize a explicação com suas próprias palavras."
                )
            )
        }
        return result
    }

    private func exportSlides() {
        guard let note = selectedNote else { return }
        let htmlSlides = slides.enumerated().map { index, slide in
            """
            <section class="slide">
              <p class="kicker">SLIDE \(index + 1) · PINEAPPLE NOTE</p>
              <h1>\(escapeHTML(slide.title))</h1>
              <p class="body">\(escapeHTML(slide.body).replacingOccurrences(of: "\n", with: "<br>"))</p>
              <p class="takeaway">\(escapeHTML(slide.takeaway))</p>
            </section>
            """
        }.joined(separator: "\n")

        let html = """
        <!doctype html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>\(escapeHTML(note.title)) · Pineapple Note</title>
          <style>
            :root { color-scheme: light; }
            * { box-sizing: border-box; }
            body { margin: 0; padding: 32px; background: \(selectedStyle.backgroundColor); color: \(selectedStyle.textColor); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
            .slide { max-width: 960px; min-height: 540px; margin: 0 auto 28px; padding: 56px; display: flex; flex-direction: column; justify-content: center; background: \(selectedStyle.cardColor); border-radius: 28px; box-shadow: 0 12px 35px rgba(0,0,0,.08); page-break-after: always; }
            .kicker { color: \(selectedStyle.accentColor); font-size: 12px; font-weight: 800; letter-spacing: .14em; }
            h1 { font-size: clamp(30px, 5vw, 54px); line-height: 1.08; margin: 20px 0; }
            .body { font-size: 21px; line-height: 1.65; white-space: pre-wrap; }
            .takeaway { margin-top: 28px; padding: 18px 22px; border-radius: 16px; background: \(selectedStyle.accentColor)18; color: \(selectedStyle.accentColor); font-weight: 800; }
            @media print { body { padding: 0; } .slide { min-height: 100vh; border-radius: 0; margin: 0; box-shadow: none; } }
          </style>
        </head>
        <body>
        \(htmlSlides)
        </body>
        </html>
        """

        exportDocument = StudySlidesDocument(data: Data(html.utf8))
        isExporting = true
    }

    private func escapeHTML(_ value: String) -> String {
        value
            .replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
            .replacingOccurrences(of: "\"", with: "&quot;")
            .replacingOccurrences(of: "'", with: "&#39;")
    }
}

private extension Color {
    init(hex: String) {
        let value = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        let int = UInt64(value, radix: 16) ?? 0
        self.init(
            .sRGB,
            red: Double((int >> 16) & 0xFF) / 255,
            green: Double((int >> 8) & 0xFF) / 255,
            blue: Double(int & 0xFF) / 255,
            opacity: 1
        )
    }
}
