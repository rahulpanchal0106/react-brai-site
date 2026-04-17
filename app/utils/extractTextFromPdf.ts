import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Optional: Set up the worker (Next.js usually needs this to run pdf.js properly)
// pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();

        fileReader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result as ArrayBuffer);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = "";

                // Loop through every page in the PDF
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    
                    // Join all the text items on the page together
                    const pageText = textContent.items.map((item: any) => item.str).join(" ");
                    fullText += pageText + "\n";
                }
                
                resolve(fullText);
            } catch (error) {
                reject(error);
            }
        };

        fileReader.onerror = (error) => reject(error);
        fileReader.readAsArrayBuffer(file);
    });
};