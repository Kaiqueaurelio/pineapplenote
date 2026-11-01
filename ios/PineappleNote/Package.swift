// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "PineappleNote",
    platforms: [.iOS(.v17)],
    products: [
        .executable(name: "PineappleNote", targets: ["PineappleNote"])
    ],
    targets: [
        .executableTarget(
            name: "PineappleNote",
            path: "Sources/PineappleNote"
        )
    ]
)
