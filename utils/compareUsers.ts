function compareUsers(u1: any, u2: any) {
  return u1.name === u2.name ? 0 : u1.name < u2.name ? -1 : 1
}

export default compareUsers