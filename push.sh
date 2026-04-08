docker buildx build --platform linux/arm64 -t quera/intranet .

# docker run -it -p 6565:6565 -e DB_HOST='82.96.139.77' -e DB_PORT='3306' -e DB_NAME='intranet-dev' -e DB_USER='quera-app' -e DB_PASSWORD='Quera2026!' quera/intranet