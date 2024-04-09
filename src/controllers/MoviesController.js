const knex = require("../database/knex")
const sqliteConnection = require("../database/sqlite")

class MoviesController {
  async create(request, response) {
    const { title, description, rating, tags } = request.body
    const user_id = request.user.id

    const [note_id] = await knex("movie_notes").insert({
      title,
      description,
      rating,
      user_id,
    })

    const tagsInsert = tags.map((name) => {
      return {
        note_id,
        user_id,
        name,
      }
    })

    await knex("movie_tags").insert(tagsInsert)

    response.json()
  }

  async update(request, response) {
    const user_id = request.user.id
    const { id } = request.params
    const { title, description, rating, tags } = request.body

    const formattedTitle = title.trim()
    const formattedDescription = description.trim()

    await knex("movie_notes").where({ id }).update({
      title: formattedTitle,
      description: formattedDescription,
      rating,
      user_id,
      updated_at: knex.fn.now(),
    })

    if (tags) {
      const tagsOfThisNote = tags.map((tag) => {
        const formattedTag = tag.trim()

        return {
          note_id: id,
          user_id,
          name: formattedTag,
        }
      })

      await knex("movie_tags").where({ note_id: id }).delete()

      await knex("movie_tags").insert(tagsOfThisNote)
    }

    return response.status(201).json({
      status: 201,
      message: "A nota foi atualizada com sucesso.",
    })
  }

  async show(request, response) {
    const { id } = request.params

    const notes = await knex("movie_notes").where({ id }).first()
    const tags = await knex("movie_tags").where({ note_id: id }).orderBy("name")

    return response.json({ ...notes, tags })
  }

  async delete(request, response) {
    const { id } = request.params

    await knex("movie_notes").where({ id }).delete()

    return response.json()
  }

  async index(request, response) {
    const { title } = request.query
    const user_id = request.user.id

    let notes = await knex("movie_notes")
      .where({ user_id })
      .whereLike("title", `%${title}%`)
      .orderBy("title")

    const userTags = await knex("movie_tags").where({ user_id })
    const notesWhithTags = notes.map((note) => {
      const noteTags = userTags.filter((tag) => tag.note_id === note.id)

      return {
        ...note,
        tags: noteTags,
      }
    })

    return response.json(notesWhithTags)
  }
}

module.exports = MoviesController
