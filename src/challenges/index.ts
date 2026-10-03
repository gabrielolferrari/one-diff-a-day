import type { Challenge } from '../types';
import { challengerGoProfileCache } from './challenger-go-profile-cache';
import { lightPythonOrdersPagination } from './light-python-orders-pagination';

export const challenges: Challenge[] = [lightPythonOrdersPagination, challengerGoProfileCache];
