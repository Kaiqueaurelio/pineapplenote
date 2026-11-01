import SwiftUI

private struct StudyMindBranch: Identifiable {
    let id = UUID()
    let title: String
    let children: [String]
}

struct StudyMindMapView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var store: StudyStore
    @State private var selectedNoteID: UUID?

    private var selectedNote: StudyNote? {
        if let selectedNoteID {
            return store.notes.first { $0.id == selectedNoteID }
        }
        return store.notes.first
    }

    private var branches: [StudyMindBranch] {
        guard let note = selectedNote else { return [] }
        return buildBranches(from: note)
    }

    private var outline: String {
        guard let note = selectedNote else { return "" }
        return ([note.title] + branches.map { branch in
            "• \(branch.title)\n" + branch.children.map { "  - \($0)" }.joined(separator: "\n")
        }).joined(separator: "\n\n")
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 17) {
                VStack(alignment: .leading, spacing: 5) {
                    Text("Mapa mental")
                        .font(.system(size: 27, weight: .bold, design: .rounded))
                        .foregroundStyle(PineapplePalette.ink)
                    Text("Organize os pontos principais da anotação em ramificações visuais.")
                        .font(.system(size: 12))
                        .foregroundStyle(PineapplePalette.muted)
                }

                if store.notes.isEmpty {
                    EmptyStudyState(
                        icon: "point.3.connected.trianglepath.dotted",
                        title: "Nenhuma anotação disponível",
                        message: "Crie uma anotação para montar seu mapa mental.",
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

                    if let note = selectedNote {
                        VStack(spacing: 12) {
                            VStack(spacing: 5) {
                                Text("TEMA CENTRAL")
                                    .font(.system(size: 9, weight: .bold))
                                    .tracking(1.2)
                                    .foregroundStyle(PineapplePalette.green)
                                Text(note.title)
                                    .font(.system(size: 20, weight: .bold, design: .rounded))
                                    .foregroundStyle(PineapplePalette.ink)
                                    .multilineTextAlignment(.center)
                                Text(note.subject)
                                    .font(.system(size: 11))
                                    .foregroundStyle(PineapplePalette.muted)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(18)
                            .background(PineapplePalette.lime.opacity(0.42), in: RoundedRectangle(cornerRadius: 18))

                            Image(systemName: "arrow.down")
                                .foregroundStyle(PineapplePalette.green.opacity(0.65))

                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                                ForEach(Array(branches.enumerated()), id: \.element.id) { index, branch in
                                    VStack(alignment: .leading, spacing: 9) {
                                        HStack(alignment: .top, spacing: 7) {
                                            Text("\(index + 1)")
                                                .font(.system(size: 10, weight: .bold))
                                                .foregroundStyle(.white)
                                                .frame(width: 22, height: 22)
                                                .background(PineapplePalette.green, in: Circle())
                                            Text(branch.title)
                                                .font(.system(size: 12, weight: .bold))
                                                .foregroundStyle(PineapplePalette.ink)
                                                .fixedSize(horizontal: false, vertical: true)
                                        }
                                        ForEach(branch.children, id: \.self) { child in
                                            HStack(alignment: .top, spacing: 5) {
                                                Circle()
                                                    .fill(PineapplePalette.green.opacity(0.6))
                                                    .frame(width: 5, height: 5)
                                                    .padding(.top, 5)
                                                Text(child)
                                                    .font(.system(size: 10))
                                                    .foregroundStyle(PineapplePalette.muted)
                                                    .fixedSize(horizontal: false, vertical: true)
                                            }
                                        }
                                    }
                                    .frame(maxWidth: .infinity, minHeight: 110, alignment: .topLeading)
                                    .padding(12)
                                    .background(.white, in: RoundedRectangle(cornerRadius: 14))
                                }
                            }

                            ShareLink(item: outline) {
                                Label("Compartilhar mapa mental", systemImage: "square.and.arrow.up")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(PineapplePalette.green, in: Capsule())
                            }
                        }
                    }
                }

                Text("Este mapa é organizado localmente a partir dos parágrafos da anotação. A versão com conexões e explicações geradas por IA depende do backend online.")
                    .font(.system(size: 11))
                    .foregroundStyle(PineapplePalette.muted)
            }
            .padding(20)
        }
        .background(PineapplePalette.cream.ignoresSafeArea())
        .navigationTitle("Mapa mental")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func buildBranches(from note: StudyNote) -> [StudyMindBranch] {
        let lines = note.body
            .components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        let sourceLines = lines.isEmpty ? [note.preview] : lines
        return sourceLines.prefix(12).enumerated().map { index, line in
            let cleaned = line
                .replacingOccurrences(of: "•", with: "")
                .replacingOccurrences(of: "- ", with: "")
                .replacingOccurrences(of: "* ", with: "")
                .trimmingCharacters(in: .whitespacesAndNewlines)
            let words = cleaned.split(whereSeparator: \.isWhitespace).map(String.init)
            let title = words.prefix(5).joined(separator: " ")
            let remainder = words.dropFirst(5).joined(separator: " ")
            let children = remainder.isEmpty
                ? ["Conceito principal do tópico \(index + 1)."]
                : [remainder]
            return StudyMindBranch(
                title: title.isEmpty ? "Tópico \(index + 1)" : title,
                children: children
            )
        }
    }
}
