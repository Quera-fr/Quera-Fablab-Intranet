import { get } from 'http';
import { desc, u } from 'motion/react-client';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Beneficiaire {
  id: number;
  email: string;
  password: string;
  nom: string;
  prenom: string;
}

interface Session {
  userId: number | null;
  isAuthenticated: boolean;
  token: string | null;
}

// ─── Service simulé (à adapter avec votre vrai authService) ─────────────────

const mockDb = {
    findByEmail: vi.fn(),
    updateLastLogin: vi.fn(),
}

const sessionStore: Session = {
    userId: null,
    isAuthenticated: false,
    token: null,
};

const authService = {
    login: async (email: string, password: string): Promise<Session> => {
        const user: Beneficiaire | null = await mockDb.findByEmail(email);

        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        if (user.password !== password) {
            throw new Error('Mot de passe incorrect');
        }

        await mockDb.updateLastLogin(user.id);

        sessionStore.userId = user.id;
        sessionStore.isAuthenticated = true;
        sessionStore.token = `token_${user.id}_${Date.now()}`;

        return sessionStore;
    },

    logout: async (userId: number): Promise<void> => {
        if (!sessionStore.isAuthenticated) {
            throw new Error('Aucune session active');
        }

        sessionStore.userId = null;
        sessionStore.isAuthenticated = false;
        sessionStore.token = null;
    },

    getSession: (): Session => ({ ...sessionStore }),
};

// ─── Données de test ─────────────────────────────────────────────────────────
const mockBeneficiaire: Beneficiaire = {
    id: 1,
    email: 'test@example.com',
    password: 'password123',
    nom: 'Doe',
    prenom: 'John',
};

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('authService - Bénéficiaire', () => {
    beforeEach(() => {
        // Reset la session avant chaque test
        sessionStore.userId = null;
        sessionStore.isAuthenticated = false;
        sessionStore.token = null;
    });

     // ── CONNEXION ─────────────────────────────────────────────────────────────

     describe('login', () => {
        it('devrait se connecter avec des identifiants valides', async () => {
            // Arrange
            mockDb.findByEmail.mockResolvedValue(mockBeneficiaire);
            mockDb.updateLastLogin.mockResolvedValue(undefined);

            // Act
            const session = await authService.login(
                mockBeneficiaire.email,
                mockBeneficiaire.password
            );

            // Assert
            expect(session.isAuthenticated).toBe(true);
            expect(session.userId).toBe(mockBeneficiaire.id);
            expect(session.token).not.toBeNull();
        });

        it('devrait appeler updateLastLogin après une connexion réussie', async () => {
            // Arrange
            mockDb.findByEmail.mockResolvedValue(mockBeneficiaire);
            mockDb.updateLastLogin.mockResolvedValue(undefined);

            // Act
            await authService.login(mockBeneficiaire.email, mockBeneficiaire.password);

            // Assert
            expect(mockDb.updateLastLogin).toHaveBeenCalledWith(mockBeneficiaire.id);
            expect(mockDb.updateLastLogin).toHaveBeenCalledTimes(1);
        });

        it('❌ devrait échouer avec un email non enregistré', async () => {
            // Arrange
            mockDb.findByEmail.mockResolvedValue(null);

            // Act & Assert
            await expect(
                authService.login('nonexistent@example.com', 'password123')
            ).rejects.toThrow('Utilisateur non trouvé');
        });

        it('❌ devrait échouer avec un mot de passe incorrect', async () => {
            // Arrange
            mockDb.findByEmail.mockResolvedValue(mockBeneficiaire);

            // Act & Assert
            await expect(
                authService.login(mockBeneficiaire.email, 'wrongpassword')
            ).rejects.toThrow('Mot de passe incorrect');
        });

        it('❌ devrait ne PAS créer de session si la connexion échoue', async () => {
            // Arrange
            mockDb.findByEmail.mockResolvedValue(undefined);

            // Act
            try {
                await authService.login('hack@example.com', '1234');
            } catch (error) {

            // Assert
                const session = authService.getSession();
                expect(session.isAuthenticated).toBe(false);
                expect(session.token).toBeNull();
            }
        });
    });

        // ── DÉCONNEXION ───────────────────────────────────────────────────────────
describe('logout', () => {

        it('devrait se déconnecter correctement', async () => {
            // Arrange - simuler une session active
            mockDb.findByEmail.mockResolvedValue(mockBeneficiaire);
            mockDb.updateLastLogin.mockResolvedValue(undefined);
            await authService.login(mockBeneficiaire.email, mockBeneficiaire.password);

            // Act
            await authService.logout(mockBeneficiaire.id);

            // Assert
            const session = authService.getSession();
            expect(session.isAuthenticated).toBe(false);
            expect(session.userId).toBeNull();
            expect(session.token).toBeNull();
        });

        it('❌ devrait échouer si aucune session active', async () => {
            // Arrange - s'assurer qu'il n'y a pas de session active

            // Act & Assert
            await expect(
                authService.logout(mockBeneficiaire.id)
            ).rejects.toThrow('Aucune session active');
        });

    });

    // ── GET SESSION ─────────────────────────────────────────────────────────────

    describe('getSession', () => {

        it('devrait retourner une session vide si non connecté', () => {
            const session = authService.getSession();

            expect(session.isAuthenticated).toBe(false);
            expect(session.userId).toBeNull();
            expect(session.token).toBeNull();
        });

        it('devrait retourner une copie de la session actuelle',
            async () => {
                mockDb.findByEmail.mockResolvedValue(mockBeneficiaire);
                mockDb.updateLastLogin.mockResolvedValue(undefined);
                await authService.login(mockBeneficiaire.email, mockBeneficiaire.password);

                const session1 = authService.getSession();
                const session2 = authService.getSession();

                // Deux objets différents mais avec les mêmes valeurs
                expect(session1).toEqual(session2);
                expect(session1).not.toBe(session2);
            });
    });

});
    
