import Client from '../lib/client';
import Schema from '../lib/schema/schema'
import Repository from '../lib/repository';
import Entity from '../lib/entity/entity';

describe("Demo", () => {

  it("demos", async () => {

    // define the interface, just for TypeScript
    interface BigfootSighting {
      id: string;
      date: number;
      title: string;
      observed: string;
      classification: string[];
      county: string;
      state: string;
      highTemp: number;
      lowTemp: number;
      fullMoon: boolean;
    }

    // define the entity class and add any business logic to it
    class BigfootSighting extends Entity {
      get highTempF() { return this.highTemp; }
      get highTempC() { return this.f2c(this.highTemp); }
      get lowTempF() { return this.lowTemp }
      get lowTempC() { return this.f2c(this.lowTemp); }

      private f2c(f: number): number { return ( f - 32 ) * 5 / 9; }
    }

    // get a client and open it
    let client = new Client();
    await client.open();

    let schema = new Schema<BigfootSighting>(
      BigfootSighting, {
        id: { type: 'string' },
        date: { type: 'number' },
        title: { type: 'string', textSearch: true },
        observed: { type: 'string', textSearch: true },
        classification: { type: 'array' },
        county: { type: 'string' },
        state: { type: 'string' },
        highTemp: { type: 'number' },
        lowTemp: { type: 'number' },
        fullMoon: { type: 'boolean' }
      });
    
    let repository = client.fetchRepository<BigfootSighting>(schema);

    await repository.createIndex();

    // create an entity
    let entity = await repository.create();
    entity.id = '8086';
    entity.title = "Bigfoot by the Walmart";
    entity.classification = [ 'ClassA', 'ClassB' ];
    entity.highTemp = 78;
    entity.fullMoon = false;

    let entityId = await repository.save(entity);
    console.log(entityId);
    
    // fetch an entity
    entity = await repository.fetch(entityId);
    console.log(entity);

    // update an entity
    entity.lowTemp = 54;
    entity.county = "Athens";
    entity.state = "Ohio";
    await repository.save(entity);

    // remove an entity
    await repository.remove(entityId);

    // search for all entities
    let allEntities = await repository.search().run();
    console.log(allEntities);

    // showing off the search syntax
    let search = repository.search()
      .where(s => s
        .where('state').is('OH')
        .orWhere('state').is('KY')
      )
      .andWhere('classification').contains('ClassA')
      .andWhere('fullMoon').isTrue();

    console.log(search.query);

    let someEntities = await search.run();
    console.log(someEntities);

    // close the client
    client.close();
  });
});
