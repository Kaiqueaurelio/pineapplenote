import SwiftUI

struct StudyRecorderView: View {
    @ObservedObject var store: StudyStore
    @StateObject private var recorder = StudyAudioRecorder()
    @State private var recordingName = ""
    @State private var statusMessage: String?
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 22) {
            VStack(spacing: 8) {
                Image(systemName: recorder.isRecording ? "waveform.circle.fill" : "mic.circle.fill")
                    .font(.system(size: 74, weight: .light))
                    .foregroundStyle(recorder.isRecording ? .red : PineapplePalette.green)
                Text(recorder.isRecording ? "Gravação em andamento" : "Grave sua aula")
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundStyle(PineapplePalette.ink)
                Text(recorder.isRecording ? "O áudio está sendo salvo neste iPhone." : "O Pineapple salva o áudio localmente para você acessar depois.")
                    .font(.system(size: 12))
                    .foregroundStyle(PineapplePalette.muted)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 28)

            Text(recorder.formattedElapsedTime)
                .font(.system(size: 42, weight: .light, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(PineapplePalette.ink)
                .accessibilityLabel("Tempo de gravação \(recorder.formattedElapsedTime)")

            if !recorder.isRecording {
                TextField("Nome da gravação (opcional)", text: $recordingName)
                    .textInputAutocapitalization(.sentences)
                    .padding(14)
                    .background(.white, in: RoundedRectangle(cornerRadius: 14))
            }

            Button(action: toggleRecording) {
                Label(
                    recorder.isRecording ? "Parar e salvar" : "Começar gravação",
                    systemImage: recorder.isRecording ? "stop.fill" : "record.circle"
                )
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(recorder.isRecording ? Color.red : PineapplePalette.green, in: Capsule())
            }

            if let statusMessage {
                Label(statusMessage, systemImage: "checkmark.circle.fill")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(PineapplePalette.green)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            VStack(alignment: .leading, spacing: 7) {
                Text("Privacidade da gravação")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(PineapplePalette.ink)
                Text("A gravação só começa depois que você toca no botão e autoriza o microfone. O arquivo fica no armazenamento privado do aplicativo e não é enviado automaticamente para a internet.")
                    .font(.system(size: 11))
                    .foregroundStyle(PineapplePalette.muted)
            }
            .padding(15)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.white, in: RoundedRectangle(cornerRadius: 15))

            Spacer()
        }
        .padding(20)
        .background(PineapplePalette.cream.ignoresSafeArea())
        .navigationTitle("Gravar aula")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Não foi possível gravar", isPresented: Binding(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK", role: .cancel) { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "Ocorreu um erro ao gravar.")
        }
        .onDisappear {
            if recorder.isRecording {
                _ = recorder.stopRecording()
            }
        }
    }

    private func toggleRecording() {
        if recorder.isRecording {
            guard let url = recorder.stopRecording() else {
                errorMessage = "A gravação ficou vazia ou não pôde ser salva."
                return
            }
            let cleanName = recordingName.trimmingCharacters(in: .whitespacesAndNewlines)
            let fallbackName = "Aula • " + Date.now.formatted(date: .abbreviated, time: .shortened)
            do {
                try store.registerRecordedAudio(
                    at: url,
                    displayName: cleanName.isEmpty ? fallbackName : cleanName
                )
                statusMessage = "Gravação salva na biblioteca."
                recordingName = ""
            } catch {
                errorMessage = error.localizedDescription
            }
            return
        }

        statusMessage = nil
        Task {
            do {
                try await recorder.startRecording()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
