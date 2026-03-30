#docker buildx build -t quera/intranet:latest-dev . 

docker run -it -p 6565:6565 \
    -e DB_HOST='82.96.139.77' \
    -e DB_PORT='3306' \
    -e DB_NAME='intranet' \
    -e DB_USER='quera-app' \
    -e DB_PASSWORD='Quera2026!' \
    quera/intranet:latest-dev