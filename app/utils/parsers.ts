// Parser para nomes de arquivo Insta360
export const parseInsta360Filename = (filename: string) => {
    const match = filename.match(/VID_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_(\d{2})_(\d{3})/);

    if (match) {
        const [_, year, month, day, hour, minute, second, lens, clip] = match;
        return {
            date: `${year}-${month}-${day}`,
            time: `${hour}:${minute}:${second}`,
            lens: lens === '00' ? 'Traseira' : lens === '10' ? 'Frontal' : 'Desconhecida',
            clipNumber: parseInt(clip, 10)
        };
    }
    return null;
};

// Parser para Canon
export const parseCanonFilename = (filename: string) => {
    const match = filename.match(/([A-Z_]{3,4})_?(\d{4})/);
    if (match) {
        const [_, prefix, fileNumber] = match;
        return {
            prefix: prefix,
            fileNumber: parseInt(fileNumber, 10)
        };
    }
    return null;
};

// Parser para GoPro
export const parseGoProFilename = (filename: string) => {
    const match = filename.match(/G[HXL](\d{2})(\d{4})/);
    if (match) {
        const [_, chapter, file] = match;
        return {
            chapter: parseInt(chapter, 10),
            fileNumber: parseInt(file, 10)
        };
    }
    return null;
};

export const parseFilename = (filename: string, camera: string) => {
    if (camera.startsWith('Insta360')) {
        return parseInsta360Filename(filename);
    } else if (camera.startsWith('Canon')) {
        return parseCanonFilename(filename);
    } else if (camera.startsWith('GoPro')) {
        return parseGoProFilename(filename);
    }
    return null;
};

export const CAMERA_MODELS = [
    'Insta360 X5',
    'Insta360 X4',
    'Insta360 X3',
    'Canon EOS R50',
    'Canon EOS R5',
    'Canon EOS R6',
    'GoPro Hero 12',
    'GoPro Hero 11',
    'DJI Osmo Action 4',
    'Sony ZV-1',
    'Outro'
];
