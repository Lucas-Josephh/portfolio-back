# 🖥️ Portfolio API – Node.js / Express / PostgreSQL

[![Node.js](https://img.shields.io/badge/Node.js-green?style=flat-square)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-black?style=flat-square)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-blue?style=flat-square)](https://www.postgresql.org/)

---

## ✨ Description

Cette API est le **back-end du portfolio personnel**.  
Elle est développée avec **Node.js**, **Express**, et utilise **PostgreSQL** pour la gestion des données.  

L’API permet de :  
- Gérer les projets et compétences  
- Stocker et vérifier un mot de passe sécurisé (bcrypt)  
- Fournir un **end-point health** pour vérifier la connexion à la base de données  

Cette API est conçue pour être utilisée par le **front-end Angular** du portfolio.

---

## 🚀 Fonctionnalités principales

- 🔹 **Gestion des projets** : création, lecture, mise à jour et suppression (`CRUD`)  
- 🔹 **Gestion des compétences** : CRUD et normalisation des niveaux (%)  
- 🔹 **Mot de passe sécurisé** : hachage avec `bcrypt`, vérification, existence  
- 🔹 **Healthcheck** : vérifier la connexion à PostgreSQL  
- 🔹 **CORS** configuré pour le front-end local et GitHub Pages  
- 🔹 **Logs d’erreurs détaillés** pour le debug  

---

## 🛠️ Technologies utilisées

| Catégorie        | Technologies |
|-----------------|--------------|
| Langage         | Node.js, JavaScript |
| Framework       | Express.js |
| Base de données | PostgreSQL |
| Sécurité        | bcrypt (hash de mots de passe) |
| Déploiement     | Vercel |

---
