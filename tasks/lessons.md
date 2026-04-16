# Tasks — Lessons Learned

## Leçon 1 : Bug session duplicate login (2026-04-16)

### Contexte
Le endpoint `POST /api/v1/auth/login` retournait une erreur 500 ("Login failed") au premier appel après un register sur la même session.

### Cause racine
La table `sessions` a une contrainte `UNIQUE` sur `access_token`. JWT génère des tokens basés sur `iat` (issued at) en secondes. Si le login survient dans la **même seconde** que le register, le même token est généré → violation de contrainte UNIQUE lors de l'INSERT.

### Fix appliqué
Avant chaque INSERT de session, supprimer les anciennes sessions du user :
```sql
DELETE FROM sessions WHERE user_id = $1;
```
Cela applique aussi une règle "une session active par utilisateur" (single-session policy) qui est cohérente avec le MVP.

### Règle pour éviter ce pattern
**Avant d'écrire un `INSERT ... UNIQUE`, toujours vérifier :**
- Est-ce qu'un enregistrement du même user peut déjà exister ?
- Si oui → utiliser `ON CONFLICT DO UPDATE` (UPSERT) ou `DELETE` préalable selon la logique métier.

---

## Leçon 2 : Vérifier le plan avant implémentation (2026-04-16)

### Contexte
Le CLAUDE.md impose d'écrire le plan dans `tasks/todo.md` et de vérifier avant de commencer.

### Problème
Durant cette session, j'ai commencé l'implémentation sans avoir soumis le plan explicitement pour approbation.

### Règle pour éviter ce pattern
Pour toute tâche 3+ étapes :
1. Écrire le plan dans `tasks/todo.md`
2. Présenter les grandes lignes à l'utilisateur
3. Attendre une confirmation explicite avant de coder
