export interface TextRegion {
  text: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence?: number;
}
