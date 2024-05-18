const request = require('supertest');
const app = require('../../app');
const { mongoConnect, mongoDisconnect } = require('../../services/mongo');

const completeLaunchData = {
  mission: "z to the moon",
  rocket: "rocket big",
  launchDate: "December 26, 2025",
  target: "Kepler-442 b",
}

const launchDataWithoutDate = {
  mission: "z to the moon",
  rocket: "rocket big",
  target: "Kepler-442 b",
}

const launchDataWithInvalidDate = {
  mission: "z to the moon",
  rocket: "rocket big",
  launchDate: "not a date string!!!",
  target: "Kepler-442 b",
}

describe('Launches API', () => {
  beforeAll( async () => {
    await mongoConnect();
  });

  afterAll(async () => {
    await mongoDisconnect();
  });

  //start tests
  describe('Test GET /v1/launches', () => {
    test('it should respond with 200 success', async () => {

      const response = await request(app)
      .get('/v1/launches')
      .expect('Content-Type', /json/)
      .expect(200);

    });
  });

  describe('Test POST /v1/launches', () => {
    test('it should respond with 201 created', async () => {

      const response = await request(app)
      .post('/v1/launches')
      .send(completeLaunchData)
      .expect('Content-Type', /json/)
      .expect(201);

      const requestDate = new Date(completeLaunchData.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();
      expect(responseDate).toBe(requestDate);

      expect(response.body).toMatchObject(launchDataWithoutDate);
    });

    test('it should catch missing required properties', async () => {
      const response = await request(app)
      .post('/v1/launches')
      .send(launchDataWithoutDate)
      .expect('Content-Type', /json/)
      .expect(400);

      expect(response.body).toStrictEqual({
        error: "Missing required launch property"
      });

    });

    test('it should catch invalid dates', async () => {
      const response = await request(app)
      .post('/v1/launches')
      .send(launchDataWithInvalidDate)
      .expect('Content-Type', /json/)
      .expect(400);

      expect(response.body).toStrictEqual({
        error: "Invalid launch date"
      });
    });
  });

});
