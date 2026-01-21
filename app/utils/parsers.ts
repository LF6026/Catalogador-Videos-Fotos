// Resultado padronizado do parsing
export interface ParsedFilename {
  date?: string;
  time?: string;
  lens?: string;
  clipNumber?: number;
  chapter?: number;
  fileNumber?: number;
  prefix?: string;
}

// Parser para nomes de arquivo Insta360
// Formato: VID_YYYYMMDD_HHMMSS_LL_CCC (ex: VID_20240115_143025_00_001.mp4)
export const parseInsta360Filename = (filename: string): ParsedFilename | null => {
  const match = filename.match(/VID_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_(\d{2})_(\d{3})/);

  if (match) {
    const [, year, month, day, hour, minute, second, lens, clip] = match;
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
// Formato: PREFIX_NNNN (ex: MVI_1234.mp4, IMG_0001.mp4)
export const parseCanonFilename = (filename: string): ParsedFilename | null => {
  const match = filename.match(/([A-Z_]{3,4})_?(\d{4})/);
  if (match) {
    const [, prefix, fileNumber] = match;
    return {
      prefix: prefix,
      fileNumber: parseInt(fileNumber, 10)
    };
  }
  return null;
};

// Parser para GoPro
// Formato: GXCCFFFF ou GHCCFFFF (ex: GX010042.mp4)
// G = GoPro, H/X/L = codec, CC = chapter, FFFF = file number
export const parseGoProFilename = (filename: string): ParsedFilename | null => {
  const match = filename.match(/G[HXL](\d{2})(\d{4})/);
  if (match) {
    const [, chapter, file] = match;
    return {
      chapter: parseInt(chapter, 10),
      fileNumber: parseInt(file, 10)
    };
  }
  return null;
};

// Parser para DJI
// Formato: DJI_YYYYMMDDHHMMSS_NNNN (ex: DJI_20240115143025_0001.mp4)
// ou DJI_NNNN (ex: DJI_0001.mp4)
export const parseDJIFilename = (filename: string): ParsedFilename | null => {
  // Formato com data/hora
  const matchFull = filename.match(/DJI_(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})_(\d{4})/);
  if (matchFull) {
    const [, year, month, day, hour, minute, second, fileNum] = matchFull;
    return {
      date: `${year}-${month}-${day}`,
      time: `${hour}:${minute}:${second}`,
      fileNumber: parseInt(fileNum, 10)
    };
  }

  // Formato simples
  const matchSimple = filename.match(/DJI_(\d{4})/);
  if (matchSimple) {
    return {
      fileNumber: parseInt(matchSimple[1], 10)
    };
  }

  return null;
};

// Parser para Sony
// Formato: C0001.mp4 ou XAVC_NNNN.mp4 ou DSC_NNNN.mp4
// Sony Alpha também usa: YYYYMMDD_HHMMSS.mp4
export const parseSonyFilename = (filename: string): ParsedFilename | null => {
  // Formato com data (algumas Sony)
  const matchDate = filename.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (matchDate) {
    const [, year, month, day, hour, minute, second] = matchDate;
    return {
      date: `${year}-${month}-${day}`,
      time: `${hour}:${minute}:${second}`
    };
  }

  // Formato C0001 (cinema line)
  const matchC = filename.match(/C(\d{4})/);
  if (matchC) {
    return {
      fileNumber: parseInt(matchC[1], 10)
    };
  }

  // Formato DSC/XAVC
  const matchDSC = filename.match(/(DSC|XAVC)_?(\d{4,5})/);
  if (matchDSC) {
    return {
      prefix: matchDSC[1],
      fileNumber: parseInt(matchDSC[2], 10)
    };
  }

  return null;
};

// Parser genérico - tenta extrair data de qualquer nome
export const parseGenericFilename = (filename: string): ParsedFilename | null => {
  // Tenta encontrar padrão de data YYYY-MM-DD ou YYYYMMDD
  const matchDate = filename.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/);
  if (matchDate) {
    const [, year, month, day] = matchDate;
    // Valida se é uma data plausível
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return {
        date: `${year}-${month}-${day}`
      };
    }
  }
  return null;
};

export const parseFilename = (filename: string, camera: string): ParsedFilename | null => {
  if (camera.startsWith('Insta360')) {
    return parseInsta360Filename(filename);
  } else if (camera.startsWith('Canon')) {
    return parseCanonFilename(filename);
  } else if (camera.startsWith('GoPro')) {
    return parseGoProFilename(filename);
  } else if (camera.startsWith('DJI')) {
    return parseDJIFilename(filename);
  } else if (camera.startsWith('Sony')) {
    return parseSonyFilename(filename);
  } else if (camera === 'Outro' || camera === 'Genérico') {
    return parseGenericFilename(filename);
  }
  // Fallback para parser genérico
  return parseGenericFilename(filename);
};

// Lista centralizada de modelos de câmera
export const CAMERA_MODELS = [
  'Insta360 X5',
  'Insta360 X4',
  'Insta360 X3',
  'Canon EOS R50',
  'Canon EOS R5',
  'Canon EOS R6',
  'GoPro Hero 12',
  'GoPro Hero 11',
  'GoPro Hero 10',
  'DJI Osmo Action 4',
  'DJI Osmo Action 3',
  'DJI Osmo Pocket 3',
  'DJI Mini 4 Pro',
  'Sony ZV-1',
  'Sony ZV-E10',
  'Sony A7 IV',
  'Sony FX30',
  'Outro'
] as const;

export type CameraModel = typeof CAMERA_MODELS[number];
