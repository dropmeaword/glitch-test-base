// planck.js airhockey
function buildTableMap() {
  let tableMap = []
  const tableHeight = 42
  const tableWidth = 24
  const goalWidth= 8
  const goalDepth= 3
  const cornerRadius = 3
  const cornerSteps = 5
  const endLength = (tableWidth - goalWidth - (cornerRadius * 2)) / 2
  const sideLength = (tableHeight - (cornerRadius * 2)) / 2
  const centerX = tableWidth / 2
  const centerY = tableHeight / 2

  tableMap.push([{
    x: -(goalWidth / 2),
    y: centerY
  },{
    x: -(goalWidth / 2) - endLength,
    y: centerY
  }])

  tableMap.push([{
    x: (goalWidth / 2),
    y: centerY
  },{
    x: (goalWidth / 2) + endLength,
    y: centerY
  }])

  tableMap.push([{
    x: -(goalWidth / 2),
    y: centerY + goalDepth
  },{
    x: (goalWidth / 2),
    y: centerY + goalDepth
  }])

  tableMap.push([{
    x: -(goalWidth / 2),
    y: centerY + goalDepth
  },{
    x: -(goalWidth / 2),
    y: centerY
  }])

  tableMap.push([{
    x: (goalWidth / 2),
    y: centerY + goalDepth
  },{
    x: (goalWidth / 2),
    y: centerY
  }])

  tableMap.push([{
    x: centerX,
    y: centerY - cornerRadius
  },{
    x: centerX,
    y: -centerY + cornerRadius
  }])

  tableMap.push([{
    x: -centerX,
    y: centerY - cornerRadius
  },{
    x: -centerX,
    y: -centerY + cornerRadius
  }])

  tableMap.push([{
    x: -(goalWidth / 2),
    y: -centerY
  },{
    x: -(goalWidth / 2) - endLength,
    y: -centerY
  }])

  tableMap.push([{
    x: (goalWidth / 2),
    y: -centerY
  },{
    x: (goalWidth / 2) + endLength,
    y: -centerY
  }])
  
  tableMap.push([{
    x: -(goalWidth / 2),
    y: -centerY - goalDepth
  },{
    x: (goalWidth / 2),
    y: -centerY - goalDepth
  }])

  tableMap.push([{
    x: -(goalWidth / 2),
    y: -centerY - goalDepth
  },{
    x: -(goalWidth / 2),
    y: -centerY
  }])

  tableMap.push([{
    x: (goalWidth / 2),
    y: -centerY - goalDepth
  },{
    x: (goalWidth / 2),
    y: -centerY
  }])

  createCorner({
    x: centerX,
    y: centerY
  },{
    x: centerX - cornerRadius,
    y: centerY - cornerRadius
  })

  createCorner({
    x: -centerX,
    y: centerY
  },{
    x: -centerX + cornerRadius,
    y: centerY - cornerRadius
  })

  createCorner({
    x: centerX,
    y: -centerY
  },{
    x: centerX - cornerRadius,
    y: -centerY + cornerRadius
  })

  createCorner({
    x: -centerX,
    y: -centerY
  },{
    x: -centerX + cornerRadius,
    y: -centerY + cornerRadius
  })

  function createCorner(start, end){
    let sum = 0
    let map = []
    const sizeX = end.x - start.x
    const sizeY = end.y - start.y

    for(let i = 0; i < cornerSteps + 1; i++){
      sum += i
      map.push(sum)
    }

    function stepWidth(index, size){
      return (size / map[cornerSteps]) * map[index]
    }

    for(let i = 0; i < cornerSteps; i++){
      const currentX = stepWidth(i, sizeX) + start.x
      const currentY = stepWidth(cornerSteps - i, sizeY) + start.y
      const nextX = stepWidth(i + 1, sizeX) + start.x
      const nextY = stepWidth(cornerSteps - i - 1, sizeY) + start.y
      tableMap.push([{x: currentX, y: currentY}, {x: nextX, y: nextY}])
    }
  }

  return tableMap
}

planck.testbed('Boxes', function(testbed) {
  testbed.y = 0
  let canMove = false
  const force = 100
  const pl = planck
  const Vec2 = pl.Vec2
  const world = pl.World()
  const table = world.createBody()
  const tableMap = buildTableMap()

  //Create Table Walls
  tableMap.map(function(edge){
    table.createFixture(pl.Edge(Vec2(edge[0].x, edge[0].y), Vec2(edge[1].x, edge[1].y)))
  })
 
  //Create Goal Detection Sensors
  const goalFixureDefinition = { isSensor: true, filterMaskBits:  0x0004 }
  const goal1Sensor = table.createFixture(pl.Edge(Vec2(-4, 22.5), Vec2(4, 22.5)), goalFixureDefinition)
  const goal2Sensor = table.createFixture(pl.Edge(Vec2(-4, -22.5), Vec2(4, -22.5)), goalFixureDefinition)
  
  //Create Paddle Blocking Walls
  table.createFixture(pl.Edge(Vec2(-4, 21), Vec2(4, 21)), { filterMaskBits:  0x0002 })
  table.createFixture(pl.Edge(Vec2(-4, -21), Vec2(4, -21)), { filterMaskBits:  0x0002 })
  table.createFixture(pl.Edge(Vec2(-12, 0), Vec2(12, 0)), { filterMaskBits:  0x0002 })

  //Create Puck
  const puck = world.createBody({
    type: 'dynamic',
    position: Vec2(0, 0),
    bullet: true,
    linearDamping: 0.1,
    angularDamping: 0.02
  })
  puck.createFixture(pl.Circle(1), {
    density: 0.25,
    restitution: 0.9,
    filterCategoryBits : 0x0004
  })
  
  //Create Paddles
  const paddleBodyDefinition = (position) => ({
    type: 'dynamic',
    position: position,
    bullet: false,
    linearDamping: 10,
    angularDamping: 1 
  })
  const paddleFixtureDefinition = {
    restitution: 0,
    filterCategoryBits : 0x0002
  }
  const paddle1 = world.createBody(paddleBodyDefinition(Vec2(0, 16)))
  paddle1.createFixture(pl.Circle(1.5), paddleFixtureDefinition)
  const paddle2 = world.createBody(paddleBodyDefinition(Vec2(0, -16)))
  paddle2.createFixture(pl.Circle(1.5), paddleFixtureDefinition)

  function updatePosition(e) {
    if(canMove){
      const vector = Vec2(e.movementX * force, -e.movementY * force)
      paddle2.applyForce(vector, Vec2(paddle2.getPosition()), true)
    }
  }
  
  function handleContact(contact) {
    const fixtureA = contact.getFixtureA()
    const fixtureB = contact.getFixtureB()
    if (fixtureA == goal1Sensor) {
      alert('player1 scored')
      world.destroyBody(puck)
    }
    if (fixtureA == goal2Sensor) {
      alert('player2 scored')
      world.destroyBody(puck)
    }
  }

  function unlock(){
    canMove = document.pointerLockElement === document.body ? true : false
  }

  document.addEventListener('pointerlockchange', () => unlock())
  window.addEventListener('mousemove', (e) => updatePosition(e))
  document.body.addEventListener('click', () => document.body.requestPointerLock())
  world.on('begin-contact', (e) => handleContact(e))

  return world
})