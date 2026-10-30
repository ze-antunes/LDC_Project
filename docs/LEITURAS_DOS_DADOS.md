# Leituras possíveis para Understanding the Magnitude of WWII

Análise do relatório, da apresentação e do CSV local, feita para orientar a evolução do projeto. As propostas abaixo são possibilidades de design; não foram todas implementadas na visualização.

## Implementação escolhida para esta revisão

Foram implementadas as leituras 1, 2 e 5 num drawer com quatro separadores: **Confronto**, **Campanha**, **Comparar** e **Amostra**. Esta escolha aproveita os campos com significado e cobertura já conhecidos, preserva a exploração pelo avião e evita apresentar interpretações de campos ainda por documentar.

- **Confronto:** barras emparelhadas para efetivos e baixas, mais razões baixas/efetivos calculadas por lado. Valores ausentes ou denominadores zero nunca produzem uma percentagem.
- **Campanha:** navegação pela designação e pelo ano, com lista cronológica e seleção do confronto. Separar o ano evita juntar silenciosamente rótulos reutilizados, como ARDENNES em 1940 e 1944.
- **Comparar:** confronto A e B, inicialmente dentro do mesmo grupo de campanha/ano, com opção explícita de alargar à amostra. Cada linha usa uma escala comum. Uma frase factual compara razões do atacante em pontos percentuais, sem inferir vencedores ou causas. O ponto B fica claro no mapa; o A mantém o vermelho.
- **Amostra:** distribuição anual, concentração dos registos e cobertura dos campos usados. Não são somadas baixas para produzir totais da guerra.
- **Comparação sugerida:** quando o grupo inicial só tem um registo, é oferecido um par de outro grupo com efetivos e baixas conhecidos para os dois lados. Escolhe-se o grupo com mais registos completos e os seus extremos temporais. O utilizador aplica a sugestão explicitamente.

A seleção fica fixa durante a leitura e o avião permanece pausado. A timeline permite mudar o confronto em leitura sem iniciar uma viagem; o voo só começa com uma ação explícita. Equipamento e terreno, nas propostas 3 e 4, continuam dependentes do dicionário de dados antes de nova interpretação visual.

### Navegação e apresentação atuais

O drawer de leitura ocupa a altura toda e sobrepõe-se ao mapa 3D através de uma camada escurecida, com o mesmo tema escuro da plataforma. O ano do confronto em leitura aparece em grande acima do minimapa. A seleção e os valores analíticos continuam a referir-se aos registos originais.

A atração dos clusters foi retirada. Há voo livre e uma sequência automática de eventos com paragens. O desenho local por setores, o nevoeiro e a continuidade periódica da geografia evitam bordas visuais durante o voo. Repetições visuais de um setor mantêm os mesmos identificadores e não aumentam contagens, baixas ou cobertura da amostra.

## A direção do relatório

O relatório propõe três narrativas: eventos, equipamento e comparação entre perspetivas dos dois lados. Propõe também navegação em terceira pessoa com um avião, exploração de frentes europeia e japonesa, zoom para aprofundar informação e uma ligação entre cronologia e mapa. A apresentação mostra países cinzentos com contornos, explosões vermelhas e uma composição centrada no avatar. É essa identidade que a implementação conserva.

O CSV disponível sustenta sobretudo a narrativa dos eventos e a comparação entre forças atacantes e defensoras. Não contém uma classificação inequívoca de vencedores, ocupação territorial ao longo do tempo, fabricantes de aviões ou mortes civis. Essas partes do conceito precisam de outras fontes.

## O que esta amostra contém

- 178 registos; 176 nomes de confronto distintos; 50 designações de campanha; 68 campos.
- Anos: 1940 — 5 registos; 1941 — 4; 1942 — 4; 1943 — 43; 1944 — 85; 1945 — 37.
- 1944 representa 47,8% da amostra. Isso caracteriza a seleção do ficheiro, não a intensidade relativa de toda a guerra.
- Os campos de carros de combate totais têm dados para os dois lados nos 178 registos. Os efetivos têm 177 pares; a artilharia, 173; as baixas, 173; as saídas aéreas, 141.
- CAMPOLEONE e TARTO-TIBER aparecem duas vezes como nomes. Nome igual não basta para eliminar um registo: é preciso comparar identificador, data e campanha.
- Na atribuição espacial aos limites atuais do mapa simplificado, 72 registos ficam em Itália. Há 32 registos sem atribuição por contenção, incluindo locais insulares ou costeiros que esta cartografia não resolve. Não se atribuem automaticamente ao país mais próximo.

## 1. A dimensão não é o mesmo que o custo

**Pergunta:** uma força maior regista necessariamente menos baixas em proporção aos seus efetivos?

**Dados:** amilpert, dmilpert, acas_per, dcas_per.

**Visualização:** dois pares de barras por confronto. Um par mostra efetivos absolutos; outro mostra a razão entre baixas e efetivos reportados. Alternar as duas leituras impede que o maior número absoluto pareça automaticamente o pior resultado proporcional. Mostrar também a quantidade de valores conhecidos.

**Limite:** não chamar a essa razão uma taxa de mortalidade. As baixas não estão decompostas em mortos, feridos, desaparecidos ou prisioneiros neste ficheiro. Não inferir o vencedor a partir da razão de baixas.

**Prioridade:** alta; aproveita campos já apresentados e reforça a narrativa comparativa do relatório.

## 2. O mesmo local, vários momentos

**Pergunta:** o que muda entre confrontos próximos de uma mesma campanha?

**Dados:** campn, engagem, date, long, lat e medidas de cada lado.

**Visualização:** ao abrir um cluster, oferecer uma sequência cronológica local e selecionar dois registos para comparação. Manter os pontos fixos no mapa e destacar o ponto atual. No painel, apresentar diferenças de efetivos, equipamento e baixas. A viagem fica ligada à leitura de uma zona em vez de saltar continuamente entre frentes.

**Limite:** um cluster espacial pode reunir campanhas diferentes. Uma designação como ARDENNES aparece em momentos afastados; a data tem de acompanhar sempre o nome. Não unir pontos com setas de avanço de tropas sem dados que confirmem essa deslocação.

**Prioridade:** alta; aproxima a exploração do avião da função de zoom e aprofundamento descrita no relatório.

## 3. A guerra como combinação de meios

**Pergunta:** como se altera o equilíbrio de meios entre atacante e defensor?

**Dados:** a_tks_to / d_tks_to, a_arty / d_arty, a_sortie / d_sortie; eventualmente os subtipos a_tks_lt / d_tks_lt e a_tks_mb / d_tks_mb.

**Visualização:** pequenos glifos emparelhados para carros de combate, artilharia e saídas aéreas dentro de cada registo. Escolher um indicador para salientar desequilíbrios no mapa sem mudar o significado do tamanho dos clusters. Guardar sempre uma legenda explícita.

**Limite:** confirmar definições e unidades no dicionário original. Saídas aéreas não representam quantidade de aviões distintos, nem estes dados identificam fabricantes ou modelos presentes numa batalha. NA não pode ser transformado em zero.

**Prioridade:** alta após validação das definições; desenvolve o eixo de equipamento sem inventar relações com os modelos 3D.

## 4. O terreno como contexto, não como explicação automática

**Pergunta:** o que distingue os contextos geográficos dos confrontos?

**Dados potenciais:** elev_mean_h, elev_min_h, elev_max_h, elev_sd_h, variantes _l, tree_ar, soft_ar, river, wet, overcast, temp, a_frontage e d_frontage.

**Visualização:** uma ficha de contexto ou pequenos múltiplos que comparem relevo, frente e condições registadas. Pode motivar percursos temáticos por confrontos em condições semelhantes.

**Limite:** as resoluções _h/_l, as unidades de frente, as codificações de temperatura e as classes categóricas precisam de documentação. Vários campos de cobertura têm muitos zeros. Não concluir que o terreno ou o clima causou um resultado apenas porque aparece associado a ele.

**Prioridade:** média, dependente de recuperar o dicionário de dados.

## 5. A história do que o arquivo deixa ver

**Pergunta:** que partes da guerra estão muito ou pouco representadas nesta seleção?

**Dados:** data, campanha, coordenadas, teatro e cobertura dos campos.

**Visualização:** usar a timeline mensal já introduzida e uma vista de cobertura por zona. Uma legenda pode dizer “registos nesta amostra”, em vez de “intensidade da guerra”. Ao selecionar um país sem pontos, explicar que ausência de registos não significa ausência de guerra.

**Limite:** não comparar totais de baixas entre países somando confrontos que possam sobrepor-se. Os limites atuais do mapa são uma referência geográfica, não uma reconstrução de fronteiras ou ocupações da década de 1940.

**Prioridade:** alta; dá honestidade e contexto à apresentação, sobretudo quando a visualização usa a palavra magnitude.

## O que merece uma auditoria antes de virar narrativa

- duration tem valores fracionários, mas as unidades não estão documentadas no material local. Não os apresentar automaticamente como dias.
- a_advance, rtadv e dist_att/dist_def parecem úteis pelo nome, mas não se deve inferir distância, velocidade, origem de tropas ou território conquistado sem definição. Alguns valores de avanço concentram-se perto de 28 000–32 000; devem ser conferidos na fonte.
- surprise tem valores negativos e múltiplas classes; não é uma variável binária simples. a_prisec/d_prisec e a_democ/d_democ são códigos cuja semântica não é explicada aqui.
- a_coup5 e d_coup5 valem zero em todos os registos; não oferecem contraste nesta amostra.
- Falta informação suficiente para atribuir vitórias, ocupações territoriais e perdas civis ou ligar fabricantes aos aviões da experiência. Essas narrativas requerem fontes adicionais e relações explícitas entre dados.

## Uma sequência de evolução que cabe no projeto

1. Refinar a exploração local: pontos, contornos, abertura dos clusters e ritmo de leitura.
2. Acrescentar comparação entre dois confrontos e razões relativas com denominadores conhecidos.
3. Validar o dicionário e adicionar os meios militares reportados.
4. Só depois alargar a história a fabricantes, ocupação territorial e resultados, com novos dados documentados.

## Fontes consultadas

- Relatório local: `Entrega Final/Understanding_The_Magnitude_Of_WWII.pdf`, sobretudo Proposta e Artefacto.
- Apresentação local: `Entrega Final/[LDC]-Apresentação_Final_JoseAntunes.pdf`, sobretudo Sketch e Artefacto.
- Dados locais: `src/WW2_LocationData_Clean - GeoBattleData_YZ.csv`.
- Cartografia de localização: `public/data/countries-110m.json`, world-atlas 2.0.2 / Natural Earth. Não é uma fonte de fronteiras históricas.
