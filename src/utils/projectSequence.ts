import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';

const SEQUENCE_DOC_ID = 'projectSequence';
const INITIAL_SEQUENCE = 1200;

export const getNextProjectSequence = async (): Promise<number> => {
    const sequenceRef = doc(db, 'counters', SEQUENCE_DOC_ID);
    
    try {
        return await runTransaction(db, async (transaction) => {
            const sequenceDoc = await transaction.get(sequenceRef);
            
            if (!sequenceDoc.exists()) {
                // Initialize the sequence if it doesn't exist
                transaction.set(sequenceRef, { currentValue: INITIAL_SEQUENCE });
                return INITIAL_SEQUENCE;
            }
            
            const currentSequence = sequenceDoc.data().currentValue;
            const nextSequence = currentSequence + 1;
            
            transaction.update(sequenceRef, { currentValue: nextSequence });
            return nextSequence;
        });
    } catch (error) {
        console.error('Error getting next project sequence:', error);
        throw error;
    }
};
