export default function JsonLd() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "React Brai",
        "operatingSystem": "Browser",
        "applicationCategory": "DeveloperApplication",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "description": "A React hook and runtime for executing Large Language Models locally in the browser using WebGPU.",
        "featureList": "WebGPU Inference, Offline Capability, React Hooks, Zero-Latency",
        "softwareRequirements": "WebGPU-enabled Browser (Chrome, Edge, Arc)"
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}