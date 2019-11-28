window.onload = function () {
  //Posição inicial das peças, onde 1 representa as peças do jogador 1 e 2 as peças do jogador 2
  //Número 0 representa posições proíbidas para movimento
  var gameBoard = [
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0, 2, 0]
  ];
  //Array que armazena a ID da peça
  var pieces = [];
  var tiles = [];

  //Fomula de distância, baseada em Pitágoras
  var dist = function (x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
  }
  //24 peças em um jogo, 12 para cada jogador
  function Piece(element, position) {
    // Se a captura for possível, movimentos simples não são permitidos para nenhuma peça
    this.allowedtomove = true;
    //linked DOM element
    this.element = element;
    //posição no tabuleiro, composta por X,Y, linha e coluna
    this.position = position;
    //Identtificação de qual jogador é a peça
    this.player = '';
    //Jogador 1 são os ID menores que 12, as demais são do jogador 2
    if (this.element.attr("id") < 12)
      this.player = 1;
    else
      this.player = 2;
    //Verifica se a peça já é uma dama
    this.king = false;
    this.makeKing = function () {
      this.element.css("backgroundImage", "url('img/king" + this.player + ".png')");
      this.king = true;
    }
    //Função de locomoção
    this.move = function (tile) {
      this.element.removeClass('selected');
      if (!Board.isValidPlacetoMove(tile.position[0], tile.position[1])) return false;
      //Não permitte que a peça mova para trás, exceto a dama
      if (this.player == 1 && this.king == false) {
        if (tile.position[0] < this.position[0]) return false;
      } else if (this.player == 2 && this.king == false) {
        if (tile.position[0] > this.position[0]) return false;
      }
      //Identifica posição do tabuleiro como vazia e marca a nova posição
      Board.board[this.position[0]][this.position[1]] = 0;
      Board.board[tile.position[0]][tile.position[1]] = this.player;
      this.position = [tile.position[0], tile.position[1]];
      //Altera a posição da peça
      this.element.css('top', Board.dictionary[this.position[0]]);
      this.element.css('left', Board.dictionary[this.position[1]]);
      //Se estive na posição inversa da inicial se transforma em dama
      if (!this.king && (this.position[0] == 0 || this.position[0] == 7))
        this.makeKing();
      return true;
    };

    //Verifica se a peça pode pular
    this.canJumpAny = function () {
      return (this.canOpponentJump([this.position[0] + 2, this.position[1] + 2]) ||
        this.canOpponentJump([this.position[0] + 2, this.position[1] - 2]) ||
        this.canOpponentJump([this.position[0] - 2, this.position[1] + 2]) ||
        this.canOpponentJump([this.position[0] - 2, this.position[1] - 2]))
    };

    //Verifica se o movimento de captura da peça pode ser feito
    this.canOpponentJump = function (newPosition) {
      //Verifica a nova posição
      var dx = newPosition[1] - this.position[1];
      var dy = newPosition[0] - this.position[0];
      //Verifica se a movimentação é permitida
      if (this.player == 1 && this.king == false) {
        if (newPosition[0] < this.position[0]) return false;
      } else if (this.player == 2 && this.king == false) {
        if (newPosition[0] > this.position[0]) return false;
      }
      //Movimentação dentro do tabuleiro
      if (newPosition[0] > 7 || newPosition[1] > 7 || newPosition[0] < 0 || newPosition[1] < 0) return false;
      //Posição onde fica a peça a ser capturada
      var tileToCheckx = this.position[1] + dx / 2;
      var tileToChecky = this.position[0] + dy / 2;
      if (tileToCheckx > 7 || tileToChecky > 7 || tileToCheckx < 0 || tileToChecky < 0) return false;
      //Verifica se há espaço para se lovomover
      if (!Board.isValidPlacetoMove(tileToChecky, tileToCheckx) && Board.isValidPlacetoMove(newPosition[0], newPosition[1])) {
        for (let pieceIndex in pieces) {
          if (pieces[pieceIndex].position[0] == tileToChecky && pieces[pieceIndex].position[1] == tileToCheckx) {
            if (this.player != pieces[pieceIndex].player) {
              //Retorna a posição da peça capturada
              return pieces[pieceIndex];
            }
          }
        }
      }
      return false;
    };

    this.opponentJump = function (tile) {
      var pieceToRemove = this.canOpponentJump(tile.position);
      //Remova a peça capturada
      if (pieceToRemove) {
        pieceToRemove.remove();
        return true;
      }
      return false;
    };

    this.remove = function () {
      //Remove a peça capturada do ttabuleiro
      this.element.css("display", "none");
      if (this.player == 1) {
        $('#player2').append("<div class='capturedPiece'></div>");
        Board.score.player2 += 1;
      }
      if (this.player == 2) {
        $('#player1').append("<div class='capturedPiece'></div>");
        Board.score.player1 += 1;
      }
      Board.board[this.position[0]][this.position[1]] = 0;
      //reset position so it doesn't get picked up by the for loop in the canOpponentJump method
      this.position = [];
      var playerWon = Board.checkifAnybodyWon();
      if (playerWon) {
        $('#winner').html("Player " + playerWon + " has won!");
      }
    }
  }

  function Tile(element, position) {
    //linked DOM element
    this.element = element;
    //Posição do quadrado no tabuleiro
    this.position = position;
    //Range daquela posição
    this.inRange = function (piece) {
      for (let k of pieces)
        if (k.position[0] == this.position[0] && k.position[1] == this.position[1]) return 'wrong';
      if (!piece.king && piece.player == 1 && this.position[0] < piece.position[0]) return 'wrong';
      if (!piece.king && piece.player == 2 && this.position[0] > piece.position[0]) return 'wrong';
      if (dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == Math.sqrt(2)) {
        //regular move
        return 'regular';
      } else if (dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == 2 * Math.sqrt(2)) {
        //jump move
        return 'jump';
      }
    };
  }

  //Board object - Controle do jogo
  var Board = {
    board: gameBoard,
    score: {
      player1: 0,
      player2: 0
    },
    playerTurn: 1,
    jumpexist: false,
    continuousjump: false,
    tilesElement: $('div.tiles'),
    //Converte posições no objeto Board.board em viewport units
    dictionary: ["0vmin", "10vmin", "20vmin", "30vmin", "40vmin", "50vmin", "60vmin", "70vmin", "80vmin", "90vmin"],
    //Inicializa um tabuleiro de tamanho 8 x 8 
    initalize: function () {
      var countPieces = 0;
      var countTiles = 0;
      for (let row in this.board) { //Percorre as 8 linhas do tabuleiro
        for (let column in this.board[row]) { //Percorre as 8 colunas do tabuleiro
          //Decide onde renderizar um quadrado e onde inserir uma peça 
          if (row % 2 == 1) {
            if (column % 2 == 0) {
              countTiles = this.tileRender(row, column, countTiles)
            }
          } else {
            if (column % 2 == 1) {
              countTiles = this.tileRender(row, column, countTiles)
            }
          }
          if (this.board[row][column] == 1) {
            countPieces = this.playerPiecesRender(1, row, column, countPieces)
          } else if (this.board[row][column] == 2) {
            countPieces = this.playerPiecesRender(2, row, column, countPieces)
          }
        }
      }
    },
    tileRender: function (row, column, countTiles) {
      this.tilesElement.append("<div class='tile' id='tile" + countTiles + "' style='top:" + this.dictionary[row] + ";left:" + this.dictionary[column] + ";'></div>");
      tiles[countTiles] = new Tile($("#tile" + countTiles), [parseInt(row), parseInt(column)]);
      return countTiles + 1
    },

    playerPiecesRender: function (playerNumber, row, column, countPieces) {
      $(`.player${playerNumber}pieces`).append("<div class='piece' id='" + countPieces + "' style='top:" + this.dictionary[row] + ";left:" + this.dictionary[column] + ";'></div>");
      pieces[countPieces] = new Piece($("#" + countPieces), [parseInt(row), parseInt(column)]);
      return countPieces + 1;
    },
    //Verifica a localição de uma peça é válida
    isValidPlacetoMove: function (row, column) {
      // Verifica se a posição está dentro do tabuleiro
      if (row < 0 || row > 7 || column < 0 || column > 7) return false;
      // Preenchido na criação do tabuleiro, verifica se a posição é válida
      if (this.board[row][column] == 0) {
        return true;
      }
      return false;
    },
    //Altera o jogador ativo - instrumentado por evento na div.turn
    changePlayerTurn: function () {
      if (this.playerTurn == 1) {
        this.playerTurn = 2;
        $('.turn').css("background", "linear-gradient(to right, transparent 50%, #BEEE62 50%)");
      } else {
        this.playerTurn = 1;
        $('.turn').css("background", "linear-gradient(to right, #BEEE62 50%, transparent 50%)");
      }
      this.check_if_jump_exist()
      return;
    },
    checkifAnybodyWon: function () {
      if (this.score.player1 == 12) {
        return 1;
      } else if (this.score.player2 == 12) {
        return 2;
      }
      return false;
    },
    //reset the game
    clear: function () {
      location.reload();
    },
    check_if_jump_exist: function () {
      this.jumpexist = false
      this.continuousjump = false;
      for (let k of pieces) {
        k.allowedtomove = false;
        // Permite o pulo somente se for um movimento permitido"
        if (k.position.length != 0 && k.player == this.playerTurn && k.canJumpAny()) {
          this.jumpexist = true
          k.allowedtomove = true;
        }
      }
      // Caso não exista o movimento, todas as peças do turno em questão tem permição para iniciar um movimento
      if (!this.jumpexist) {
        for (let k of pieces) k.allowedtomove = true;
      }
    },

    // Possibly helpful for communication with back-end.
    str_board: function () {
      ret = ""
      for (let i in this.board) {
        for (let j in this.board[i]) {
          var found = false
          for (let k of pieces) {
            if (k.position[0] == i && k.position[1] == j) {
              if (k.king) ret += (this.board[i][j] + 2)
              else ret += this.board[i][j]
              found = true
              break
            }
          }
          if (!found) ret += '0'
        }
      }
      return ret
    }
  }

  //Inicializa o tabuleiro
  Board.initalize();

  /***
  Events
  ***/

  //Verifica se a peça clicada é do jogador daquele turno
  $('.piece').on("click", function () {
    var selected;
    var isPlayersTurn = ($(this).parent().attr("class").split(' ')[0] == "player" + Board.playerTurn + "pieces");
    if (isPlayersTurn) {
      if (!Board.continuousjump && pieces[$(this).attr("id")].allowedtomove) {
        if ($(this).hasClass('selected')) selected = true;
        $('.piece').each(function (index) {
          $('.piece').eq(index).removeClass('selected')
        });
        if (!selected) {
          $(this).addClass('selected');
        }
      } else {
        let exist = "jump exist for other pieces, that piece is not allowed to move"
        let continuous = "continuous jump exist, you have to jump the same piece"
        let message = !Board.continuousjump ? exist : continuous
        console.log(message)
      }
    }
  });

  //Reseta o jogo, simples F5
  $('#cleargame').on("click", function () {
    Board.clear();
  });

  //Move a peça quando um espaço é clicado
  $('.tile').on("click", function () {
    //Verifica se uma peça está selecionada
    if ($('.selected').length != 0) {
      //Encontra o espaço selecionado
      var tileID = $(this).attr("id").replace(/tile/, '');
      var tile = tiles[tileID];
      //Encontra a peça selecionada
      var piece = pieces[$('.selected').attr("id")];
      //Verifica para quais espaços aquela peça pode se mover
      var inRange = tile.inRange(piece);
      if (inRange != 'wrong') {
        //Se o espaço clicado não estiver no alcance da peça, verifica se com captura é possível realizar o movimento
        if (inRange == 'jump') {
          if (piece.opponentJump(tile)) {
            // Movimenta a peça
            piece.move(tile);
            // Se possível realizar outra captura mantem a peça selecionada
            if (piece.canJumpAny()) {
              piece.element.addClass('selected');
              Board.continuousjump = true;
            } else {
              Board.changePlayerTurn()
            }
          }
          // Caso a captura não seja possível, somente movimentação simples
        } else if (inRange == 'regular' && !Board.jumpexist) {
          if (!piece.canJumpAny()) {
            piece.move(tile);
            Board.changePlayerTurn()
          } else {
            alert("You must jump when possible!");
          }
        }
      }
    }
  });
}