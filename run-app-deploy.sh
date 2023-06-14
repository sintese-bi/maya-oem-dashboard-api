#!/bin/bash

usage()
{
    echo "========================================================================================================"
    echo "Parâmetros:                           "
    echo ""
    echo "--dev   Ambiente DEV - Ambiente local do Desenvolvedor           "
    echo "--prod  Ambiente PROD - Ambiente de produção."
    echo "========================================================================================================"
}

case $1 in
    --dev | --prod );;
    -h | --help )
        usage
        exit
    ;;
    * )
        usage
        exit 1
esac


if [ $1 == "--dev" ]; then
    echo "Iniciando ambiente de desenvolvimento..."
    echo "Desconstruindo containers, caso existam..."
    docker-compose down
    echo "Construindo containers de desenvolvimento..."
    docker-compose up -d --build
fi
if [ $1 == "--prod" ]; then
    echo "Fazendo deploy em ambiente de Produção"
    
    echo "Desconstruindo containers, caso existam..."
    docker-compose -f docker-compose-prod.yml down
    echo "Construindo containers de desenvolvimento"
    docker-compose -f docker-compose-prod.yml up -d --build
fi