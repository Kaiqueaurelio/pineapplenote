import AVFoundation
import Foundation
import SwiftUI

@MainActor
final class StudyAudioRecorder: ObservableObject {
    @Published private(set) var isRecording = false
    @Published private(set) var elapsedSeconds = 0

    private var audioRecorder: AVAudioRecorder?
    private var startedAt: Date?
    private var elapsedTask: Task<Void, Never>?

    func startRecording() async throws {
        guard !isRecording else { return }
        guard await AVAudioApplication.requestRecordPermission() else {
            throw StudyAudioRecorderError.permissionDenied
        }

        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetoothHFP])
        try session.setActive(true)

        do {
            let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let folderURL = documentsURL.appendingPathComponent("StudyMaterials", isDirectory: true)
            try FileManager.default.createDirectory(at: folderURL, withIntermediateDirectories: true)

            let fileURL = folderURL.appendingPathComponent("aula-\(UUID().uuidString).m4a")
            let settings: [String: Any] = [
                AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
                AVSampleRateKey: 44_100,
                AVNumberOfChannelsKey: 1,
                AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
            ]
            let newRecorder = try AVAudioRecorder(url: fileURL, settings: settings)
            newRecorder.isMeteringEnabled = true
            guard newRecorder.prepareToRecord(), newRecorder.record() else {
                throw StudyAudioRecorderError.couldNotStart
            }

            audioRecorder = newRecorder
            startedAt = .now
            elapsedSeconds = 0
            isRecording = true
            startElapsedCounter()
        } catch {
            try? session.setActive(false, options: .notifyOthersOnDeactivation)
            throw error
        }
    }

    @discardableResult
    func stopRecording() -> URL? {
        guard let audioRecorder else { return nil }
        audioRecorder.stop()
        let fileURL = audioRecorder.url
        self.audioRecorder = nil
        startedAt = nil
        elapsedTask?.cancel()
        elapsedTask = nil
        isRecording = false
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)

        guard FileManager.default.fileExists(atPath: fileURL.path) else { return nil }
        let attributes = try? FileManager.default.attributesOfItem(atPath: fileURL.path)
        let size = (attributes?[.size] as? NSNumber)?.int64Value ?? 0
        return size > 0 ? fileURL : nil
    }

    private func startElapsedCounter() {
        elapsedTask?.cancel()
        elapsedTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(1))
                guard !Task.isCancelled,
                      let self,
                      let startedAt = self.startedAt else { return }
                self.elapsedSeconds = Int(Date().timeIntervalSince(startedAt))
            }
        }
    }

    var formattedElapsedTime: String {
        String(format: "%02d:%02d", elapsedSeconds / 60, elapsedSeconds % 60)
    }
}

enum StudyAudioRecorderError: LocalizedError {
    case permissionDenied
    case couldNotStart

    var errorDescription: String? {
        switch self {
        case .permissionDenied:
            return "O acesso ao microfone foi negado. Você pode ativá-lo em Ajustes > Privacidade e Segurança > Microfone."
        case .couldNotStart:
            return "O iPhone não conseguiu iniciar a gravação. Verifique se o microfone está disponível."
        }
    }
}
