import java.util.Scanner;

public class HillCipher {
    private static final int MATRIX_SIZE = 4; // Change this value for larger matrices
    private static final int MODULO = 26;

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.print("Enter the 4x4 key matrix (row-wise, e.g., 6 24 1 13 20 17 15 23 17 14 23 14 17 20 17 1): ");
        int[][] keyMatrix = new int[MATRIX_SIZE][MATRIX_SIZE];
        for (int i = 0; i < MATRIX_SIZE; i++) {
            for (int j = 0; j < MATRIX_SIZE; j++) {
                keyMatrix[i][j] = scanner.nextInt();
            }
        }

        scanner.nextLine(); // Consume the newline character

        System.out.print("Enter the plaintext (uppercase letters only): ");
        String plaintext = scanner.nextLine();

        // Encryption
        String ciphertext = encrypt(plaintext, keyMatrix);
        System.out.println("Encrypted Text: " + ciphertext);

        // Decryption
        String decryptedText = decrypt(ciphertext, keyMatrix);
        System.out.println("Decrypted Text: " + decryptedText);

        scanner.close();
    }

    private static String encrypt(String plaintext, int[][] keyMatrix) {
        StringBuilder encryptedText = new StringBuilder();

        while (plaintext.length() % MATRIX_SIZE != 0) {
            plaintext += 'X'; // Padding with 'X' if the length is not a multiple of MATRIX_SIZE
        }

        for (int i = 0; i < plaintext.length(); i += MATRIX_SIZE) {
            for (int j = 0; j < MATRIX_SIZE; j++) {
                int sum = 0;
                for (int k = 0; k < MATRIX_SIZE; k++) {
                    sum += (keyMatrix[j][k] * (plaintext.charAt(i + k) - 'A'));
                }
                encryptedText.append((char) ((sum % MODULO) + 'A'));
            }
        }

        return encryptedText.toString();
    }

    private static String decrypt(String ciphertext, int[][] keyMatrix) {
        int determinant = calculateDeterminant(keyMatrix);

        int multiplicativeInverse = 0;
        for (int i = 1; i < MODULO; i++) {
            if ((determinant * i) % MODULO == 1) {
                multiplicativeInverse = i;
                break;
            }
        }

        int[][] inverseMatrix = calculateInverseMatrix(keyMatrix, multiplicativeInverse);

        StringBuilder decryptedText = new StringBuilder();

        for (int i = 0; i < ciphertext.length(); i += MATRIX_SIZE) {
            for (int j = 0; j < MATRIX_SIZE; j++) {
                int sum = 0;
                for (int k = 0; k < MATRIX_SIZE; k++) {
                    sum += (inverseMatrix[j][k] * (ciphertext.charAt(i + k) - 'A'));
                }
                decryptedText.append((char) ((sum % MODULO) + 'A'));
            }
        }

        return decryptedText.toString();
    }

    private static int calculateDeterminant(int[][] matrix) {
        int det = matrix[0][0] * matrix[1][1] * matrix[2][2] * matrix[3][3] -
                  matrix[0][0] * matrix[1][2] * matrix[2][3] * matrix[3][1] +
                  matrix[0][0] * matrix[1][3] * matrix[2][1] * matrix[3][2] -
                  matrix[0][1] * matrix[1][3] * matrix[2][2] * matrix[3][0] +
                  matrix[0][1] * matrix[1][2] * matrix[2][0] * matrix[3][3] -
                  matrix[0][1] * matrix[1][0] * matrix[2][3] * matrix[3][2] +
                  matrix[0][2] * matrix[1][0] * matrix[2][1] * matrix[3][3] -
                  matrix[0][2] * matrix[1][1] * matrix[2][3] * matrix[3][0] +
                  matrix[0][2] * matrix[1][3] * matrix[2][0] * matrix[3][1] -
                  matrix[0][3] * matrix[1][2] * matrix[2][0] * matrix[3][1] +
                  matrix[0][3] * matrix[1][0] * matrix[2][2] * matrix[3][1] -
                  matrix[0][3] * matrix[1][1] * matrix[2][0] * matrix[3][2];

        return det % MODULO;
    }

    private static int[][] calculateInverseMatrix(int[][] matrix, int multiplicativeInverse) {
        int[][] inverseMatrix = new int[MATRIX_SIZE][MATRIX_SIZE];

        for (int i = 0; i < MATRIX_SIZE; i++) {
            for (int j = 0; j < MATRIX_SIZE; j++) {
                int cofactor = calculateCofactor(matrix, i, j);
                int value = (cofactor * multiplicativeInverse) % MODULO;
                if (value < 0) {
                    value += MODULO;
                }
                inverseMatrix[j][i] = value;
            }
        }

        return inverseMatrix;
    }

    private static int calculateCofactor(int[][] matrix, int row, int col) {
        int minorMatrixSize = MATRIX_SIZE - 1;
        int[][] minorMatrix = new int[minorMatrixSize][minorMatrixSize];

        for (int i = 0, r = 0; i < MATRIX_SIZE; i++) {
            if (i != row) {
                for (int j = 0, c = 0; j < MATRIX_SIZE; j++) {
                    if (j != col) {
                        minorMatrix[r][c] = matrix[i][j];
                        c++;
                    }
                }
                r++;
            }
        }

        int determinant = calculateDeterminant(minorMatrix);

        int sign = ((row + col) % 2 == 0) ? 1 : -1;

        return (sign * determinant) % MODULO;
    }
}
