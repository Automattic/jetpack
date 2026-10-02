export type GradientType =
  | 'linear-gradient'
  | 'repeating-linear-gradient'
  | 'radial-gradient'
  | 'repeating-radial-gradient'
  | 'conic-gradient'
  | 'repeating-conic-gradient';

export type AngleUnit = 'deg' | 'rad' | 'grad' | 'turn';

export type LengthUnit = 'px' | 'em' | 'rem' | 'vw' | 'vh' | 'vmin' | 'vmax' | 'ch' | 'ex';

export interface DirectionalNode {
  type: 'directional';
  value: string;
}

export interface AngularNode {
  type: 'angular';
  value: string;
  unit: AngleUnit;
}

export interface ConicOrientationNode {
  type: 'conic';
  angle?: AngularNode;
  at?: PositionNode;
}

export interface ShapeNode {
  type: 'shape';
  value: 'circle' | 'ellipse';
  style?: LengthNode | ExtentKeywordNode | PositionNode;
  at?: PositionNode;
}

export interface DefaultRadialNode {
  type: 'default-radial';
  at: PositionNode;
  hasAtKeyword?: boolean;
}

export interface ExtentKeywordNode {
  type: 'extent-keyword';
  value: 'closest-side' | 'closest-corner' | 'farthest-side' | 'farthest-corner' | 'contain' | 'cover';
  at?: PositionNode;
}

export interface PositionNode {
  type: 'position';
  value: {
    x?: LengthNode | PositionKeywordNode;
    y?: LengthNode | PositionKeywordNode;
  };
}

export interface PositionKeywordNode {
  type: 'position-keyword';
  value: 'center' | 'left' | 'right' | 'top' | 'bottom';
}

export interface PercentageNode {
  type: '%';
  value: string;
}

export interface PxNode {
  type: 'px';
  value: string;
}

export interface EmNode {
  type: 'em';
  value: string;
}

export interface RemNode {
  type: 'rem';
  value: string;
}

export interface VwNode {
  type: 'vw';
  value: string;
}

export interface VhNode {
  type: 'vh';
  value: string;
}

export interface VminNode {
  type: 'vmin';
  value: string;
}

export interface VmaxNode {
  type: 'vmax';
  value: string;
}

export interface ChNode {
  type: 'ch';
  value: string;
}

export interface ExNode {
  type: 'ex';
  value: string;
}

export interface CalcNode {
  type: 'calc';
  value: string;
}

export type LengthNode =
  | PercentageNode
  | PxNode
  | EmNode
  | RemNode
  | VwNode
  | VhNode
  | VminNode
  | VmaxNode
  | ChNode
  | ExNode
  | CalcNode
  | PositionKeywordNode;

export interface LiteralColorStop {
  type: 'literal';
  value: string;
  length?: LengthNode;
  length2?: LengthNode;
}

export interface HexColorStop {
  type: 'hex';
  value: string;
  length?: LengthNode;
  length2?: LengthNode;
}

export interface RGBColorStop {
  type: 'rgb';
  value: string[];
  length?: LengthNode;
  length2?: LengthNode;
}

export interface RGBAColorStop {
  type: 'rgba';
  value: string[];
  length?: LengthNode;
  length2?: LengthNode;
}

export interface HSLColorStop {
  type: 'hsl';
  value: string[];
  length?: LengthNode;
  length2?: LengthNode;
}

export interface HSLAColorStop {
  type: 'hsla';
  value: string[];
  length?: LengthNode;
  length2?: LengthNode;
}

export interface VarColorStop {
  type: 'var';
  value: string;
  length?: LengthNode;
  length2?: LengthNode;
}

export type ColorStop =
  | LiteralColorStop
  | HexColorStop
  | RGBColorStop
  | RGBAColorStop
  | HSLColorStop
  | HSLAColorStop
  | VarColorStop;

export type LinearOrientation = DirectionalNode | AngularNode;
export type RadialOrientation = ShapeNode | DefaultRadialNode | ExtentKeywordNode;

export interface LinearGradientNode {
  type: 'linear-gradient' | 'repeating-linear-gradient';
  orientation?: LinearOrientation;
  colorStops: ColorStop[];
}

export interface RadialGradientNode {
  type: 'radial-gradient' | 'repeating-radial-gradient';
  orientation?: RadialOrientation[];
  colorStops: ColorStop[];
}

export interface ConicGradientNode {
  type: 'conic-gradient' | 'repeating-conic-gradient';
  orientation?: ConicOrientationNode;
  colorStops: ColorStop[];
}

export type GradientNode = LinearGradientNode | RadialGradientNode | ConicGradientNode;

export function parse(gradientString: string): GradientNode[];
export function stringify(ast: GradientNode[] | GradientNode | null): string;
