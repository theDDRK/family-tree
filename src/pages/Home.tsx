import React from 'react';

function Home({ filename, persons, handleFileChange }: { filename: string | null, persons: any, handleFileChange: (filename: string, buffer: ArrayBuffer) => void }) {

    const [uploadedFile, setUploadedFile] = React.useState<boolean | null>(filename !== null && persons && persons.persons.length > 0);

    console.log(filename, persons);
    const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log(file);
            const arrayBuffer = new FileReader();
            arrayBuffer.onload = () => {
                const buffer = arrayBuffer.result as ArrayBuffer;
                handleFileChange(file.name, buffer);
                setUploadedFile(true);
            };
            arrayBuffer.readAsArrayBuffer(file);
        }
    };

    return (
        <div>
            <h1>Welkom bij FamilieBoom</h1>
            {uploadedFile &&
            <>
                <h2>Huidig bestand</h2>
                <p>Naam: {filename}</p>
                <p>Aantal personen: {persons.persons.length}</p>
            </>
            }
            <h2>Upload een GEDCOM-bestand</h2>
            <input type="file" accept=".ged" onChange={handleUpload} />
        </div>
    );
};

export default Home;