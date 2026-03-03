// constants/layout.js
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const LAYOUT = {
  screen: {
    width,
    height: Dimensions.get('window').height,
  },
  library: {
    columnCount: 2,
    paddingHorizontal: 16,
    gap: 16,
    cardWidth: (width - (16 * 2) - 16) / 2,
  },
};

// También exportamos valores individuales para compatibilidad
export const COLUMN_COUNT = 2;
export const PADDING_HORIZONTAL = 16;
export const GAP = 16;
export const CARD_WIDTH = (width - (PADDING_HORIZONTAL * 2) - GAP) / COLUMN_COUNT;