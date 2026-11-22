#!/bin/sh
# Uso: ./trocar-dominio.sh https://www.seudominio.com.br
# Troca o placeholder https://SEU-DOMINIO.com.br pelo domínio definitivo em todos os arquivos de SEO.
set -e
[ -z "$1" ] && { echo "Informe o domínio, ex.: ./trocar-dominio.sh https://www.drakellybarbi.com.br"; exit 1; }
DOM="${1%/}"
for f in index.html robots.txt sitemap.xml llms.txt 404.html humans.txt; do
  [ -f "$f" ] && sed -i '' "s#https://SEU-DOMINIO.com.br#$DOM#g" "$f"
done
grep -rl "SEU-DOMINIO" . --include='*.html' --include='*.txt' --include='*.xml' || echo "Pronto: domínio aplicado em todos os arquivos."
