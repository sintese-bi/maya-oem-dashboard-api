> 💡 Tecnologias utilizadas no projeto:

<code><img height="20" src="https://sequelize.org/v6/image/brand_logo.png"></code>
<code><img height="20" src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/nodejs/nodejs.png"></code>
<code><img height="20" src="https://cdn.iconscout.com/icon/free/png-512/postgresql-226047.png"></code>
<code><img height="20" src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/terminal/terminal.png"></code>
<code><img height="20" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Visual_Studio_Code_1.35_icon.svg/1024px-Visual_Studio_Code_1.35_icon.svg.png"></code>


## 💡 Sobre o Projeto

...

### Requerimentos

- [Node.js](https://nodejs.org/en/download/) 

## 💻 Iniciar o projeto

#### 📦 Backend

```bash
    # Clone Repository
    git clone 

    #Acesse um diretório do back-end
    cd \somai-dashboad-backend
    #Logo após, instale as dependências necessárias
    npm i ou yarn
    #Por fim, iniciar a api
    npm dev ou yarn dev


    ## Criar banco de dados
    -- IPAM --
    Setp 1º - yarn or npx sequelize-cli db:create # criando banco de dados
    Setp 2º - yarn or npx sequelize-cli db:migrate # criando todas as tabeals
    Setp 3º - yarn or npx sequelize-cli db:seed:all # inserindo todas os dados da seeds
    sequelize db:seed:undo --seed (name)

    sequelize-cli migration:generate --name create-clientes
```

> Pronto, seu backend já está inicializado. Você pode ver os dados da migration pela [url](http://localhost:8080/) ou pelo [insomnia](https://insomnia.rest/download/) > http://localhost:8080/
