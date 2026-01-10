import { useState, useEffect } from 'react';

export function useJson<T>(ai: any) {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRefining, setIsRefining] = useState(false);

    // 1. The Trigger Function
    const generate = async (inputText: string, schema: object) => {
        if (ai.isLoading || !ai.isReady) {
            console.warn("AI is busy or not ready.");
            return;
        }

        console.log("Starting JSON Generation...");
        setIsRefining(true);
        setData(null);
        setError(null);

        const systemPrompt = `
            You are a Data Extraction Engine.
            Task: Extract data from the user input and format it strictly as JSON.
            Schema: ${JSON.stringify(schema)}
            Rules:
            - Output ONLY valid JSON.
            - Do not include markdown formatting (no \`\`\`).
            - If data is missing, use null.
        `;

        try {
            await ai.chat([
                { role: "system", content: systemPrompt },
                { role: "user", content: inputText }
            ]);

            console.log("systempormot: ", systemPrompt)
            console.log("it: ", inputText)
        } catch (e) {
            console.error("Chat Trigger Failed:", e);
            setError("Failed to start generation");
            setIsRefining(false);
        }
    };

    // 2. The Listener
    useEffect(() => {
        // Only run if we are in "Refining" mode and AI has stopped loading
        if (isRefining && !ai.isLoading) {

            console.log("Generation finished. Response length:", ai.response?.length);

            if (!ai.response) {
                console.error("Error: Response is empty.");
                setError("Model returned no data.");
                setIsRefining(false);
                return;
            }

            try {
                // Clean up the output
                const jsonString = ai.response.replace(/```json|```/g, "").trim();
                console.log("Parsing JSON:", jsonString);

                const parsedData = JSON.parse(jsonString);
                setData(parsedData);
            } catch (err) {
                console.error("JSON Parse Error:", err);
                console.log("Raw Output was:", ai.response);
                setError("Failed to parse JSON. Check console for raw output.");
            } finally {
                setIsRefining(false);
            }
        }
    }, [ai.isLoading, ai.response, isRefining]);

    return {
        generate,
        data,
        isLoading: ai.isLoading,
        error,
        progress: ai.progress
    };
}