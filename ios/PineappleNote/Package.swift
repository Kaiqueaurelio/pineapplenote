// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "PineappleNote",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .library(
            name: "PineappleNote",
            targets: ["PineappleNote"]
        )
    ],
    targets: [
        .target(
            name: "PineappleNote",
            path: "Sources/PineappleNote"
        ),
        .testTarget(
            name: "PineappleNoteTests",
            dependencies: ["PineappleNote"],
            path: "Tests/PineappleNoteTests"
        )
    ]
)
