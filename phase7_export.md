# 🚀 Exécution & Planning - Phase 7 (MyProx)

Ce document centralise toutes les étapes techniques de la **Phase 7**. Il sert de référence pour le développement final des fonctionnalités avancées de MyProx.

---

## ✅ 1. Console VNC (Terminé)
*L'intégration de NoVNC s'est faite nativement via WebView.*
- [x] Injection silencieuse des cookies `PVEAuthCookie` depuis le Backend.
- [x] Création du composant mobile `VncScreen` (force l'Autolandscape).
- [x] Interception et proxyfication des websockets de flux vidéo Proxmox.
- [x] Bouton 🖥️ sur la vue `VMDetailsScreen`.

---

## ⏳ 2. Surveillance Avancée & Nœud (Node)
*Gestion des ressources primaires du serveur Proxmox.*
- [ ] **API Backend** : Créer les endpoints `/api/v1/servers/:id/node/status` et `/updates`.
- [ ] **Mobile** : Construire l'écran ⚙️ `ServerSettingsScreen`.
- [ ] **Mises à jour (APT)** :
  - Affichage de la liste complète des paquets disponibles.
  - Bouton "Lancer la mise à jour" (`apt dist-upgrade` via API native PVE).
  - Alerte visuelle : *Mise en garde informant l'utilisateur des risques d'upgrade OS depuis un mobile.*

---

## ⏳ 3. Intégration Proxmox Backup Server (PBS)
*Fusion des deux environnements majeurs de Proxmox.*
- [ ] **Modèle BDD** : Mettre à jour `proxmox_servers` pour supporter un champ `type_server` (`pve` ou `pbs`).
- [ ] **Mobile - Ajout** : Étendre le formulaire d'ajout pour spécifier si on connecte un PVE ou un PBS.
- [ ] **Dashboard Unifié** : Afficher distinctement les serveurs 🖥️ virtuels et les 💾 serveurs de sauvegarde.
- [ ] **API PBS** : Lecture des *Datastores* et remontée des logs *(Garbage Collection, Prune, Verify)*.

---

## ⏳ 4. Diagnostics Systèmes V1
*Santé préventive de l'infrastructure.*
- [ ] **Alertes Disque** : Trigger visuel si le stockage ZFS / LVM dépasse 90%.
- [ ] **Surveillance Nœud** : Badge "Hors-ligne" réactif sur le Dashboard Mobile.
- [ ] **Logs** : Lecture des erreurs PVE critiques (`/cluster/log`) et affichage sur une vue dédiée.

---

## 🔮 5. Synchronisation iCloud & Push (Premium)
*Dernière étape métier, axée monétisation.*
- [ ] **iCloud (Expo Secure Store)** : Sécurisation du Keychain. À l'ouverture sur un nouvel appareil Apple, restauration automatique des identifiants (Zero Login Host).
- [ ] **Expo Push Notifications** : Connexion à APNs/Firebase permettant au Cloud Relay d'alerter le mobile (*Mise à jour majeure dispo, ou Noeud PVE déconnecté*).

---

> [!TIP]
> **Suivi CI/CD** : Toute modification poussée vers `main` sur le dossier `backend/` ou `website/` déclenche un build Docker. Le VPS de production clone, met à jour et relance la suite Docker de manière autonome et sans délai.
