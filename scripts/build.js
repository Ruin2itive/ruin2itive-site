import fs from "fs"
import Parser from "rss-parser"

const parser = new Parser()

async function getFeed(url, limit=5){
  try{
    const feed = await parser.parseURL(url)
    return feed.items.slice(0,limit).map(i=>({
      title:i.title,
      url:i.link
    }))
  }catch(e){
    return []
  }
}

async function build(){
  const data = {
    crypto: await getFeed("https://decrypt.co/feed"),
    hn: await getFeed("https://hnrss.org/frontpage"),
    world: await getFeed("https://feeds.bbci.co.uk/news/world/rss.xml")
  }

  fs.mkdirSync("data",{recursive:true})
  fs.writeFileSync("data/home.json",JSON.stringify(data,null,2))
}

build()
