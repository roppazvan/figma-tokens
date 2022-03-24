import { TokenTypes } from '@/constants/TokenTypes';
import { SingleGenericToken } from './SingleGenericToken';
export declare type SingleSpacingToken<Named extends boolean = true, P = unknown> = SingleGenericToken<TokenTypes.SPACING, string, Named, P>;
