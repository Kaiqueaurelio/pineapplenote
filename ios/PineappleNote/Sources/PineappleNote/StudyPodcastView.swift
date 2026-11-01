import AVFoundation
import SwiftUI

@MainActor
private final class StudySpeechController: NSObject, ObservableObject, AVSpeechSynthesizerDelegate {
    @Published private(set) var isSpeaking = false
    private let synthesizer = AVSpeechSynthesizer()

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    func speak(_ text: String) {
        stop()
        let cleanedText = String(text.prefix(12_000))
        guard !cleanedText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }

        let utterance = AVSpeechUtterance(string: cleanedText)
        utterance.voice = AVSpeechSynthesisVoice(language: "pt-BR")
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate
        utterance.pitchMultiplier = 1.0
        synthesizer.speak(utterance)
        isSpeaking = true
    }

    func stop() {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        isSpeaking = false
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor [weak self] in
            self?.isSpeaking = false
        }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        Task { @MainActor [weak self] in
            self?.isSpeaking = false
        }
    }
}

struct StudyPodcastView: View {
    @ObservedObject var store: StudyStore
    @StateObject private var speech = StudySpeechController()
    @State private var selectedNoteID: UUID?

    private var selectedNote: StudyNote? {
        if let selectedNoteID {
            return store.notes.first { $0.id == selectedNoteID }
        }
        return store.notes.first
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 17) {
                VStack(alignment: .leading, spacing: 5) {
                    Text("Podcast de estudo")
                        .font(.system(size: 27, weight: .bold, design: .rounded))
                        .foregroundStyle(PineapplePalette.ink)
                    Text("Transforme suas anotações em áudio usando a voz do iPhone.")
                        .font(.system(size: 12))
                        .foregroundStyle(PineapplePalette.muted)
                }

                if store.notes.isEmpty {
                    EmptyStudyState(
                        icon: "waveform",
                        title: "Nenhuma anotação disponível",
                        message: "Crie uma anotação para começar a ouvir seu conteúdo.",
                        actionTitle: "Voltar às ferramentas"
                    ) {}
                } else {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Escolha uma anotação")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(PineapplePalette.ink)
                        ForEach(store.notes) { note in
                            Button {
                                speech.stop()
                                selectedNoteID = note.id
                            } label: {
                                HStack(spacing: 10) {
                                    Image(systemName: "doc.text")
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
                                .padding(12)
                                .background(.white, in: RoundedRectangle(cornerRadius: 13))
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    if let note = selectedNote {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Agora ouvindo")
                                .font(.system(size: 10, weight: .bold))
                                .tracking(1)
                                .foregroundStyle(PineapplePalette.green)
                            Text(note.title)
                                .font(.system(size: 19, weight: .bold, design: .rounded))
                                .foregroundStyle(PineapplePalette.ink)
                            Text(note.preview)
                                .font(.system(size: 12))
                                .foregroundStyle(PineapplePalette.muted)
                                .lineLimit(6)
                            Button {
                                if speech.isSpeaking {
                                    speech.stop()
                                } else {
                                    speech.speak(note.exportText)
                                }
                            } label: {
                                Label(
                                    speech.isSpeaking ? "Parar reprodução" : "Ouvir anotação",
                                    systemImage: speech.isSpeaking ? "stop.fill" : "play.fill"
                                )
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(speech.isSpeaking ? Color.red : PineapplePalette.green, in: Capsule())
                            }
                        }
                        .padding(17)
                        .background(.white, in: RoundedRectangle(cornerRadius: 18))
                    }
                }

                Text("A leitura é feita pelo sintetizador de voz do iOS. Não há envio de áudio ou texto para servidores.")
                    .font(.system(size: 11))
                    .foregroundStyle(PineapplePalette.muted)
            }
            .padding(20)
        }
        .background(PineapplePalette.cream.ignoresSafeArea())
        .navigationTitle("Podcast")
        .navigationBarTitleDisplayMode(.inline)
        .onDisappear { speech.stop() }
    }
}
