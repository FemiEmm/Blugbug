const paragraph = (text) => `<p>${text}</p>`;
const heading = (text) => `<h2>${text}</h2>`;

const channelArticle = ({ intro, sections = [], close }) => [
  paragraph(intro),
  ...sections.flatMap((section) => [
    heading(section.heading),
    ...section.paragraphs.map(paragraph),
  ]),
  paragraph(close),
].join('');

export const channelUsers = [
  ['channel-history-ng','history-nigeria','history@channel.blugbug','History Nigeria','history.nigeria','Stories of Nigerian peoples, kingdoms, languages, festivals, craft, food, and memory.'],
  ['channel-super-eagles','super-eagles-archive','football@channel.blugbug','Super Eagles Archive','supereagles.archive','Nigeria national-team history told era by era, from the early tours to the modern squad.'],
  ['channel-naija-music','naija-music-archive','music@channel.blugbug','Naija Music Archive','naijamusic.archive','A living archive of Nigerian sound, scenes, instruments, performers, and musical movements.'],
  ['channel-politics-ng','nigeria-politics-desk','politics@channel.blugbug','Nigeria Politics Desk','nigeria.politics','Plain-language context for the institutions, ideas, and turning points shaping Nigerian public life.'],
  ['channel-endsars','endsars-archive','endsars@channel.blugbug','End SARS Archive','endsars.archive','A careful public-memory channel documenting the movement, its voices, demands, and continuing questions.'],
  ['channel-election-ng','nigeria-election-watch','elections@channel.blugbug','Nigeria Election Watch','nigeria.elections','Non-partisan explainers and timelines for Nigeria’s 2023 record and the road to the 2027 elections.'],
];

export const channelPosts = [
  [
    'history-yoruba',
    'channel-history-ng',
    'Yoruba Culture: Cities, Oríkì, and a Living Artistic Tradition',
    'History',
    channelArticle({
      intro: `Ask where Yoruba history begins and you may hear several answers. Ilé-Ifẹ̀ carries enormous spiritual and cultural weight, while Ọ̀yọ́ became one of the most powerful political centres in the region. That variety is part of the point. Yoruba history was never the story of one city doing everything. It developed through towns, kingdoms, families, markets, religious traditions, artists, farmers, soldiers, traders, and generations of people carrying memory from one place to another.`,
      sections: [
        {
          heading: `Cities, power, and memory`,
          paragraphs: [
            `Historic Yoruba towns developed strong identities of their own, but they were also connected by language, trade, migration, conflict, marriage, and shared cultural practices. Ilé-Ifẹ̀ is deeply associated with origin traditions and sacred kingship. Ọ̀yọ́ became known for political organisation and regional influence. Other towns built their own reputations around commerce, craft, religion, scholarship, and local leadership. Looking at these places together gives a better picture than treating Yoruba civilisation as one straight line.`,
            `Political history matters, but daily life is where culture becomes personal. Names can carry family stories. Greetings can show age and respect. Clothing can signal celebration, status, or community. Food, music, festivals, and religious practice create a rhythm that people recognise even when they live far from their ancestral towns. That is one reason Yoruba identity has travelled so well across Nigeria and the wider world.`
          ],
        },
        {
          heading: `Oríkì, art, and a culture that keeps moving`,
          paragraphs: [
            `Oríkì praise poetry is one of the clearest examples of memory becoming performance. An oríkì can praise, challenge, tease, remember, and locate a person inside a family or community history. Drumming, carving, textiles, beadwork, theatre, and dance do something similar in different forms. They do not simply decorate culture. They help people tell stories about who they are and where they come from.`,
            `Modern Yoruba culture does not survive by pretending nothing has changed. It appears in films, fashion, music, comedy, literature, churches, traditional institutions, festivals, social media, and everyday speech. Some customs are debated. Some are adapted. Some are revived with new meaning. That tension is not a weakness. It is evidence that the culture is alive enough to argue with itself.`
          ],
        },
      ],
      close: `The most useful way to understand Yoruba culture is not as a frozen collection of old customs, but as a living conversation between history and the present. The cities, words, songs, clothes, rituals, and family stories matter because people still use them to explain themselves. Culture lasts when people keep choosing what to remember, what to question, and what to pass on.`,
    }),
  ],
  [
    'history-igbo',
    'channel-history-ng',
    'Igbo Culture: Community, Enterprise, and the New Yam Festival',
    'History',
    channelArticle({
      intro: `There is no single doorway into Igbo history. One community may emphasise titled societies, another may point to market networks, age grades, masquerades, farming traditions, or stories of migration. What connects these histories is not one central kingdom, but a long tradition of communities organising themselves through families, councils, associations, trade, and shared responsibilities.`,
      sections: [
        {
          heading: `Community without one central model`,
          paragraphs: [
            `Igbo political organisation historically varied from place to place. Some communities relied heavily on assemblies, elders, age grades, titled people, lineage groups, and other institutions that balanced authority rather than placing it in one permanent central ruler. That diversity sometimes confuses people who expect every civilisation to fit the same political template. It should not. Different systems can still produce order, accountability, hierarchy, negotiation, and collective decision-making.`,
            `Markets were also more than places to buy and sell. They connected villages, created social networks, spread news, supported specialised trades, and gave people space to build reputations beyond their immediate families. Enterprise became one of the most visible features associated with Igbo life, but it grew from older habits of mobility, exchange, apprenticeship, and community support.`
          ],
        },
        {
          heading: `Harvest, art, and belonging`,
          paragraphs: [
            `The New Yam festival is one of the best-known seasonal celebrations across many Igbo communities. Customs differ, but the basic idea often combines harvest, gratitude, renewal, hospitality, and the recognition that food carries social meaning. A yam is not only a crop when it appears inside a festival. It can become a symbol of labour, survival, status, generosity, and the beginning of a new agricultural cycle.`,
            `Masquerade, uli artistic traditions, music, storytelling, dance, and local forms of symbolic communication reveal another side of Igbo cultural life. These practices change from community to community, which is exactly why broad statements about "the Igbo" should be handled carefully. Dialect, religion, migration, class, family history, and location all shape what people practise and how they understand it.`
          ],
        },
      ],
      close: `Igbo identity has survived war, migration, urbanisation, global movement, and enormous social change because it has never depended on one expression alone. It lives in villages and megacities, in family meetings and businesses, in festivals and digital spaces. The thread running through it is not sameness, but a continuing relationship with ancestry, responsibility, enterprise, and community.`,
    }),
  ],
  [
    'history-hausa',
    'channel-history-ng',
    'Hausa Culture: Walled Cities, Trade, and the Art of Storytelling',
    'History',
    channelArticle({
      intro: `Long before modern borders and highways, Hausa cities were already busy centres of trade, scholarship, craft, agriculture, and political life. Kano, Katsina, Zaria, Daura, and other historic centres grew around markets, walls, gates, palaces, workshops, farms, and routes that linked local communities to a much wider world. Their history reminds us that urban life in West Africa did not begin with colonial rule.`,
      sections: [
        {
          heading: `Cities built around movement`,
          paragraphs: [
            `A walled city was more than a defensive space. Gates controlled movement, markets attracted traders, rulers organised administration, and specialised neighbourhoods could become associated with particular crafts or occupations. Goods, ideas, languages, and religious scholarship moved through these spaces. Hausa became a major language of exchange because people needed a common way to communicate across trade, travel, and administration.`,
            `That movement also shaped identity. Hausa culture absorbed influences from neighbouring peoples, Islamic scholarship, regional trade, and changing political systems without becoming one uniform experience. A merchant in Kano, a farmer outside a city, a scholar, a craft worker, and a performer could all participate in Hausa culture from very different positions.`
          ],
        },
        {
          heading: `Storytelling in sound, cloth, leather, and architecture`,
          paragraphs: [
            `Culture is not only found in political records. It is also carried in praise singing, oral tales, humour, food, dress, leatherwork, embroidery, indigo dyeing, architecture, music, and public celebration. These are the forms people encounter in everyday life, and they are often the parts of culture that visitors remember first.`,
            `Yet it is worth looking beneath the surface. A fabric pattern may carry regional associations. A praise singer may be preserving memory while entertaining an audience. A building style may reveal available materials, climate, status, and inherited design knowledge. Even familiar objects become historical evidence when we ask who made them, who used them, and what they meant.`
          ],
        },
      ],
      close: `Hausa identity cannot be reduced to one city, one occupation, or one religious expression. It has been shaped by centuries of movement and exchange. The culture feels durable because it has repeatedly found ways to absorb change while keeping recognisable forms of language, craft, memory, and public life.`,
    }),
  ],
  [
    'history-edo',
    'channel-history-ng',
    'Edo Culture and the Enduring Legacy of the Benin Kingdom',
    'History',
    channelArticle({
      intro: `Few places in Nigerian history are as visually powerful as Benin. The old kingdom built a court culture, administrative system, earthworks, artistic workshops, ceremonies, and royal traditions that still shape how Edo history is remembered today. The Oba remains central to that memory, but the story reaches far beyond the palace.`,
      sections: [
        {
          heading: `A kingdom recorded in art`,
          paragraphs: [
            `Brass plaques and heads, ivory carvings, coral regalia, palace objects, guild traditions, and ceremonial art did more than look impressive. They recorded authority, relationships, events, status, and ideas about kingship. Art was tied to institutions and skilled communities of makers. Looking at these objects without that context turns history into decoration.`,
            `The kingdom also developed large earthworks and an organised capital whose scale challenged many outsiders' assumptions about African urban and political life. Benin City was not important because Europeans eventually wrote about it. It was important because generations of Edo people built, governed, traded, worshipped, made art, and maintained a sophisticated political centre there.`
          ],
        },
        {
          heading: `1897 and the question of what was taken`,
          paragraphs: [
            `The British invasion of 1897 violently disrupted the kingdom and removed large numbers of royal and cultural objects. Many of those works later entered museums and private collections outside Nigeria. Today, restitution debates are not only about ownership. They raise questions about conquest, memory, museum authority, documentation, and what it means for a community to encounter important parts of its heritage far from home.`,
            `At the same time, Edo culture should never be reduced to stolen objects. Language, family histories, Igue and other ceremonies, coral traditions, craft knowledge, food, music, titles, and the living city continued after colonial violence. Culture survived because people continued to practise it, not because museums preserved it for them.`
          ],
        },
      ],
      close: `The Benin Kingdom matters as a major chapter of African political and artistic history, but Edo culture is not a chapter that ended in 1897. It remains visible in institutions, ceremonies, family memory, contemporary art, and the arguments surrounding restitution. The past is still present because people continue to claim it.`,
    }),
  ],
  [
    'history-efik',
    'channel-history-ng',
    'Efik Culture: Calabar, Ekpe, and Cross-River Exchange',
    'History',
    channelArticle({
      intro: `To understand Efik history, it helps to begin with water. Old Calabar and the wider Cross River region were shaped by creeks, rivers, trading routes, and communities that looked outward as well as inward. Movement across water connected people, goods, languages, institutions, and eventually some of the darkest parts of Atlantic history.`,
      sections: [
        {
          heading: `Trade, authority, and communication`,
          paragraphs: [
            `Efik communities built commercial and political relationships across the Cross River area and beyond. Trade could create wealth and influence, but it also tied the region into the Atlantic slave economy and later colonial systems. That history is uncomfortable, but leaving it out would make the story cleaner than the past really was.`,
            `The Ekpe institution historically carried social, judicial, ceremonial, and political significance in parts of the region. Nsibidi signs formed a rich visual language shared across neighbouring cultural environments. These systems show that communication and authority were not limited to written colonial records. People already had complex ways of marking relationships, decisions, status, knowledge, and social responsibility.`
          ],
        },
        {
          heading: `Culture people still recognise`,
          paragraphs: [
            `Efik identity is also immediately visible in food, dress, dance, language, naming, ceremony, and family life. Cuisine in particular has become one of the most widely recognised gateways into Efik culture, but food should not be treated as a cute footnote. Recipes carry geography, trade, agriculture, memory, and the everyday work of families.`,
            `Like every living culture, Efik life has changed through Christianity, education, migration, urbanisation, media, and global movement. What remains interesting is how older practices continue to be remembered, reinterpreted, or sometimes debated within new settings.`
          ],
        },
      ],
      close: `Efik history is a story of exchange. Some of that exchange created opportunity and cultural richness. Some brought violence and exploitation. Holding both truths together gives a fuller picture of a society shaped by waterways, institutions, trade, memory, and an ability to adapt without disappearing.`,
    }),
  ],
  [
    'history-ibibio',
    'channel-history-ng',
    'Ibibio Culture: Masks, Kinship, and the Land of Akwa Ibom',
    'History',
    channelArticle({
      intro: `Ibibio culture is often encountered through striking masks, dance, food, and ceremony, but those visible expressions rest on something deeper: relationships. Family, village organisation, age, association, farming, fishing, and shared obligations helped structure life across Ibibio-speaking communities with their own local histories.`,
      sections: [
        {
          heading: `Community before spectacle`,
          paragraphs: [
            `It is easy to focus on the most dramatic parts of culture, especially masquerade and performance. Yet those forms make more sense when placed inside the communities that created them. Masks, music, dance, naming, wood carving, and ceremony could communicate moral ideas, ancestry, status, memory, and social expectations. They were not simply entertainment for an audience.`,
            `The land and waterways of the region also shaped daily life. Farming, fishing, markets, and seasonal rhythms influenced foodways and social organisation. The result was a culture rooted in place but connected through travel, marriage, trade, and exchange with neighbouring peoples.`
          ],
        },
        {
          heading: `What changes and what stays`,
          paragraphs: [
            `Modern Ibibio life stretches from villages in Akwa Ibom and nearby areas to cities across Nigeria and communities abroad. Churches, schools, formal employment, migration, entertainment, and digital media have changed the settings in which identity is performed. A person does not have to live exactly as an ancestor did to remain connected to culture.`,
            `Language and family ties remain powerful anchors. So do food, ceremonies, names, stories, and the expectation that people understand where they come from. The details may shift, but the desire to locate oneself inside a larger community remains strong.`
          ],
        },
      ],
      close: `Ibibio culture becomes more interesting when it is seen as a living system rather than a collection of colourful traditions. Its art, performance, food, and ceremonies matter because they sit inside relationships between people, land, memory, and responsibility. That is what allows culture to move into new environments without losing every trace of where it began.`,
    }),
  ],
  [
    'history-tiv',
    'channel-history-ng',
    'Tiv Culture: The Swange Rhythm and a History of Movement',
    'History',
    channelArticle({
      intro: `Mention Tiv culture and many Nigerians immediately picture black-and-white fabric or hear the rhythm of Swange in their heads. Those symbols are important, but they are only the front door. Tiv history is also about movement, farming, lineage, land, storytelling, political change, and the difficult work of maintaining community through periods of pressure.`,
      sections: [
        {
          heading: `Land, ancestry, and belonging`,
          paragraphs: [
            `Tiv communities are strongly associated with the Benue Valley, where agriculture and settlement shaped social organisation. Accounts of ancestry and migration help explain how people understand relationships between families and places. Land is therefore not simply an economic resource. It can also carry memory, inheritance, identity, and obligations to future generations.`,
            `That connection to land makes periods of conflict and displacement especially painful. When communities are moved, threatened, or divided, the loss is not measured only in property. It can affect access to farms, graves, family networks, cultural sites, and the everyday routines that make a place feel like home.`
          ],
        },
        {
          heading: `Swange as conversation`,
          paragraphs: [
            `Swange is one of the most recognisable Tiv performance traditions, combining rhythm, dance, costume, movement, and social commentary. A performance can entertain while also reflecting community values, relationships, humour, or criticism. That combination is part of what makes traditional performance so durable. People return for the enjoyment, but they also return because the performance says something about them.`,
            `The black-and-white anger cloth has become a visual shorthand for Tiv identity, especially in public celebrations and national representation. Still, no culture should be reduced to one fabric. Language, food, family structure, farming knowledge, music, dance, storytelling, and local histories all contribute to the larger picture.`
          ],
        },
      ],
      close: `Tiv culture is worth understanding beyond its most recognisable symbols. Its strength is visible in the way communities continue to protect memory, performance, language, and belonging while facing modern pressures. Culture here is not only celebration. It is also a way of refusing to become invisible.`,
    }),
  ],
  [
    'history-kanuri',
    'channel-history-ng',
    'Kanuri Culture and the Long Memory of Kanem-Borno',
    'History',
    channelArticle({
      intro: `Kanuri history opens onto a map much larger than modern Nigeria. Around the Lake Chad basin, the long-lived Kanem-Borno civilisation connected courts, scholarship, cavalry, agriculture, trade, and religious learning across a region that now falls within several countries. Modern borders came later. The cultural memory is older.`,
      sections: [
        {
          heading: `A civilisation built across routes`,
          paragraphs: [
            `Kanem-Borno endured through changing political centres, rulers, alliances, and pressures. Its longevity mattered because institutions had time to develop, adapt, and influence surrounding communities. Trans-Saharan exchange linked the region to wider networks of commerce and scholarship, while local agriculture and settlement sustained everyday life.`,
            `Islamic learning became an important part of public culture, shaping education, law, titles, and political identity. Language, dress, food, music, and leadership traditions also developed their own recognisable forms. The Shehu institution remains one of the clearest symbols of historical continuity within Kanuri public life.`
          ],
        },
        {
          heading: `A culture divided by modern borders`,
          paragraphs: [
            `Today, Kanuri communities live across national boundaries that did not define the older cultural region. Families, languages, trade routes, and memories can therefore stretch across borders even when governments treat those spaces separately. This is one reason national maps can sometimes hide as much history as they reveal.`,
            `Environmental change and insurgency have brought severe disruption to the Lake Chad region. Communities have faced displacement, insecurity, and economic pressure. Yet cultural survival continues through family networks, religious institutions, language, food, oral history, and the everyday decision to teach younger generations what came before them.`
          ],
        },
      ],
      close: `Kanuri history is powerful because of its scale and duration, but it is also deeply human. Empires matter because people lived inside them. Borders matter because families cross them. Conflict matters because communities must rebuild after it. The long memory of Kanem-Borno survives not as nostalgia, but as a living reference point for people still shaping the region today.`,
    }),
  ],
  [
    'history-ijaw',
    'channel-history-ng',
    'Ijaw Culture: Waterways, Masquerades, and Niger Delta Memory',
    'History',
    channelArticle({
      intro: `The Niger Delta is not a background to Ijaw history. It is one of its main characters. Creeks, rivers, mangroves, fishing grounds, canoe routes, tides, and wetlands shaped where communities settled, how they moved, what they ate, how they traded, and how they understood the environment around them.`,
      sections: [
        {
          heading: `Life shaped by water`,
          paragraphs: [
            `Knowledge of water can be as important as knowledge of roads in other parts of the country. Canoe travel, fishing, trading routes, and the ability to read changing waterways supported everyday life. Communities developed distinct histories and dialects across the Delta, so Ijaw identity should not be treated as one perfectly uniform block.`,
            `Masquerades, festivals, oral traditions, music, and spiritual relationships with water reflect the environment in which these communities developed. Performance can carry memory while also bringing people together in the present. Like many cultural forms, meaning is often layered. What looks spectacular to an outsider may carry family, spiritual, historical, or political significance to people inside the community.`
          ],
        },
        {
          heading: `Oil changed the Delta`,
          paragraphs: [
            `The arrival and expansion of the oil economy transformed the Niger Delta. It created national wealth and new political importance, but many local communities also experienced pollution, damaged livelihoods, conflict, and frustration over who benefits from resources extracted from their land and water. These issues cannot be separated from modern Ijaw political and cultural life.`,
            `Environmental justice therefore becomes a cultural question as well as an economic one. If fishing waters are damaged, a livelihood is threatened. If communities are displaced, memory and tradition can be disrupted. Protecting culture sometimes means protecting the physical environment that made that culture possible.`
          ],
        },
      ],
      close: `Ijaw history is a story of adaptation to a complex environment, but it is also a story of people demanding the right to remain connected to that environment. The Delta's waterways hold trade routes, family histories, songs, conflicts, and memories. To understand the culture, you have to understand the water.`,
    }),
  ],
  [
    'history-nupe',
    'channel-history-ng',
    'Nupe Culture: Glass Beads, River Trade, and Bida Craft',
    'History',
    channelArticle({
      intro: `Nupe history is closely tied to rivers, especially the Niger and Kaduna systems that supported farming, fishing, transport, markets, and regional exchange. Bida became an important political and craft centre, but the story of Nupe culture is best understood through both institutions and the skilled hands that kept traditions alive.`,
      sections: [
        {
          heading: `Rivers, markets, and a connected society`,
          paragraphs: [
            `River systems created movement. Farmers brought produce to markets, fishers worked the waterways, traders connected settlements, and political centres drew people into wider networks. That constant exchange made Nupe communities part of a larger central Nigerian world rather than isolated pockets of culture.`,
            `Islamic scholarship, palace institutions, titles, music, festivals, and food traditions added further layers to public life. As with other Nigerian cultures, these elements developed through contact and adaptation. Traditions survived because they were flexible enough to continue inside changing political and economic conditions.`
          ],
        },
        {
          heading: `Craft as knowledge`,
          paragraphs: [
            `Nupe artisans became known for glass beads, brasswork, weaving, embroidery, pottery, and carved objects. The finished product is only half the story. The more interesting question is how the knowledge moves from one generation to the next. A workshop can function like a classroom where technique, patience, design, business sense, and reputation are taught by doing.`,
            `That is why craft should not be treated as something old-fashioned sitting behind glass. It is a form of technology and memory. Materials change. Markets change. Customers change. But the ability to transform raw material into an object that carries beauty, use, and identity remains valuable.`
          ],
        },
      ],
      close: `Nupe culture shows how history can live in ordinary work. A bead, a brass object, a woven cloth, or a market route can tell us about skill, trade, class, family, and survival. Culture lasts when people continue to practise it, teach it, and find new reasons for others to care.`,
    }),
  ],

  [
    'eagles-early',
    'channel-super-eagles',
    'Before the Super Eagles: The UK Tour and Nigeria’s Early National Team',
    'Sports',
    channelArticle({
      intro: `Before the green shirts, World Cup nights, penalty shootouts, and endless arguments about who should start up front, Nigeria's national team had a much humbler beginning. The 1949 tour of the United Kingdom sits near the start of that story. The players travelled in a colonial era, before independence and before the national team became the giant cultural institution Nigerians know today.`,
      sections: [
        {
          heading: `Football before independence`,
          paragraphs: [
            `The side that toured Britain was commonly remembered as the UK Tourists. They represented a country that did not yet control its own political future, but football was already becoming a place where Nigerians could see themselves represented collectively. Matches were not simply about scorelines. They were part of a growing public identity built through newspapers, crowds, local clubs, schools, and regional competitions.`,
            `The national team's identity changed over time. The Red Devils name was later replaced by the Green Eagles after independence, and eventually the Super Eagles. Those changes tracked a country trying to define how it wanted to be seen. Colours, badges, nicknames, and administrators changed, but the emotional idea of a national team kept growing.`
          ],
        },
        {
          heading: `Why the early era still matters`,
          paragraphs: [
            `Modern football makes it easy to judge older teams by today's standards. That misses the point. Earlier players travelled under very different conditions, played with different equipment, and operated without the massive media, sponsorship, and professional support systems that surround elite football now.`,
            `What they helped create was expectation. Every later generation inherited the idea that pulling on the national shirt meant representing more than a club or region. That expectation would eventually become both the Super Eagles' greatest source of pride and one of the heaviest pressures around the team.`
          ],
        },
      ],
      close: `The 1949 tour deserves to be remembered because every football culture has a beginning. Nigeria's national team did not suddenly appear in 1994. Decades of players, coaches, organisers, supporters, and changing institutions built the road that eventually led to African titles and World Cup nights.`,
    }),
  ],
  [
    'eagles-1980',
    'channel-super-eagles',
    'The 1980 Green Eagles: A First African Crown at Home',
    'Sports',
    channelArticle({
      intro: `There are football victories that feel bigger than football. Nigeria's 1980 Africa Cup of Nations triumph was one of them. The Green Eagles were playing at home, expectations were enormous, and the possibility of winning a first continental title gave every match an extra layer of pressure.`,
      sections: [
        {
          heading: `A tournament that became a national event`,
          paragraphs: [
            `Home advantage sounds comfortable until you remember what it really means. Every mistake is seen. Every selection is debated. Every draw feels like a warning. The Green Eagles had to turn the energy of the crowd into momentum rather than anxiety. As the tournament progressed, belief grew around a side that looked increasingly capable of finishing the job.`,
            `The final against Algeria became the moment everything pointed toward. Nigeria won and lifted its first Africa Cup of Nations trophy. Segun Odegbami and his teammates moved from being talented internationals to permanent reference points in Nigerian football history.`
          ],
        },
        {
          heading: `The birth of a new expectation`,
          paragraphs: [
            `A first title changes how a country thinks about itself. Before 1980, continental success was something Nigeria wanted. After 1980, it became something supporters could demand again. Future squads would be compared with the champions, and near misses would feel more painful because the ceiling had already been raised.`,
            `The victory also strengthened the idea that Nigerian football should combine results with personality. Supporters wanted winning football, but they also wanted confidence, flair, pace, and a team that looked comfortable carrying the weight of the shirt.`
          ],
        },
      ],
      close: `Every later Super Eagles generation inherited something from 1980. The trophy proved that Nigeria could reach the top of African football. It also created a standard that has never really disappeared: compete seriously, entertain when possible, and never treat the biggest prize as something meant for someone else.`,
    }),
  ],
  [
    'eagles-1994',
    'channel-super-eagles',
    'The 1994 Golden Generation and Nigeria’s World Cup Arrival',
    'Sports',
    channelArticle({
      intro: `For many Nigerian supporters, 1994 is not just a year. It is a feeling. Nigeria arrived at the World Cup as African champions, carrying a squad full of confidence, power, imagination, and characters who looked completely comfortable on the global stage. The world was meeting Nigeria at a World Cup for the first time, but the team did not behave like tourists.`,
      sections: [
        {
          heading: `A team that announced itself`,
          paragraphs: [
            `The victory over Bulgaria produced one of the defining images of Nigerian sport: Rashidi Yekini grabbing the net after scoring, overwhelmed by the moment. Around him was a squad packed with personality. Jay-Jay Okocha could make a midfield feel like a stage. Finidi George brought invention. Daniel Amokachi supplied force and movement. Stephen Keshi carried leadership. Others added balance, discipline, and experience.`,
            `Nigeria advanced from the group and reached the round of sixteen, where Italy ended the run after a tense contest. The defeat hurt because the possibility of going further had become real. Nigeria was no longer merely happy to be present. Supporters had seen enough to believe the team could stand beside established football nations.`
          ],
        },
        {
          heading: `Why the generation became a benchmark`,
          paragraphs: [
            `The 1994 side is remembered for more than results. It had an identity. The football often looked expressive and fearless, and the players carried themselves with a swagger that connected strongly with supporters at home. That combination of quality and personality created a standard later teams would constantly be measured against.`,
            `Memory can make old teams look perfect, and they were not. But nostalgia survives when a team gives people moments they can still picture years later. Yekini in the net. Okocha turning away from pressure. Green shirts on the biggest stage. Those images became part of how Nigeria imagines football greatness.`
          ],
        },
      ],
      close: `The 1994 generation did not win the World Cup, but it changed Nigeria's place in the global football conversation. The team arrived as newcomers and left with credibility. Every Super Eagles squad since has had to live, fairly or unfairly, with the question: can you make us feel like that again?`,
    }),
  ],
  [
    'eagles-2000s',
    'channel-super-eagles',
    'The 2000s: Near Misses, Big Personalities, and Constant Expectation',
    'Sports',
    channelArticle({
      intro: `The 2000s were a strange period for the Super Eagles. Nigeria had too much talent to be ignored, but not enough stability to turn every promising tournament into a trophy. The team remained dangerous, recognisable, and full of major personalities, yet supporters often finished competitions thinking the same thing: we could have done more.`,
      sections: [
        {
          heading: `Stars everywhere, certainty nowhere`,
          paragraphs: [
            `Players such as Nwankwo Kanu, Austin Okocha, Joseph Yobo, Obafemi Martins, Vincent Enyeama, and others carried enormous expectations. On paper, the squad often looked capable of challenging anyone in Africa. On the pitch, there were strong runs, dramatic games, and repeated appearances near the business end of tournaments.`,
            `The frustration came from how often Nigeria stopped just short. Semi-final exits and tournament disappointments began to feel familiar. Coaching changes, administrative tension, selection debates, and questions about preparation regularly surrounded the football. Talent could rescue difficult moments, but talent alone could not guarantee continuity.`
          ],
        },
        {
          heading: `The lesson of the near miss`,
          paragraphs: [
            `This era is useful because it exposes one of football's simplest truths. A national team can have famous players and still lack a stable identity. International football gives coaches little time, so planning, trust, clear roles, and a healthy environment matter enormously.`,
            `Supporters sometimes remember only the players who failed to lift a trophy, but that can be unfair. The 2000s kept Nigeria competitive through a changing football landscape and produced individuals who became icons in their own right. The disappointment came precisely because the ceiling looked so high.`
          ],
        },
      ],
      close: `The 2000s Super Eagles were rarely irrelevant. They were often close, often entertaining, sometimes chaotic, and almost always under pressure. Their story is a reminder that great squads are not built from names alone. The difference between being competitive and becoming champions is usually found in the spaces around the talent.`,
    }),
  ],
  [
    'eagles-2013',
    'channel-super-eagles',
    'The 2013 Super Eagles: Stephen Keshi’s Team Finds Its Moment',
    'Sports',
    channelArticle({
      intro: `Nigeria did not enter the 2013 Africa Cup of Nations surrounded by the aura of an unbeatable favourite. That became part of the charm. Stephen Keshi built a squad that mixed established internationals with players who still had something to prove, including home-based options he was willing to trust.`,
      sections: [
        {
          heading: `Growing inside the tournament`,
          paragraphs: [
            `Tournament football can change quickly. A team does not need to look perfect in the first match if it keeps solving problems as the competition goes on. Nigeria grew into the 2013 campaign, finding confidence and structure at the right time. The quarter-final victory over Côte d'Ivoire was especially important because it showed the Super Eagles could beat a side many people considered one of the strongest in Africa.`,
            `From there, belief changed. Nigeria was no longer simply surviving the tournament. The team looked like a side that could win it. Sunday Mba became one of the campaign's defining figures, and his goal in the final against Burkina Faso gave Nigeria its third African title.`
          ],
        },
        {
          heading: `Keshi's place in history`,
          paragraphs: [
            `For Stephen Keshi, the victory carried an extra layer of meaning. He became only the second person to win the Africa Cup of Nations as both a player and a coach. That achievement connected the modern team to earlier generations and strengthened his status in Nigerian football history.`,
            `The 2013 side is also remembered because it did not fit a simple superstar narrative. It was a team that found resilience, roles, and confidence inside the competition. That can be more satisfying than watching a favourite simply confirm expectations.`
          ],
        },
      ],
      close: `The 2013 triumph remains one of the clearest reminders that tournaments are living things. Predictions matter less once the matches begin. A coherent team can grow, adapt, and outrun expectations. Nigeria did exactly that, and by the end, the trophy felt less like a surprise than the conclusion of a team that had learned how to believe in itself.`,
    }),
  ],
  [
    'eagles-modern',
    'channel-super-eagles',
    'The Modern Super Eagles: New Talent, Old Pressure',
    'Sports',
    channelArticle({
      intro: `The modern Super Eagles have access to one of the deepest pools of Nigerian football talent in the world. Players develop in different leagues, academies, domestic clubs, and national systems before arriving in camp with very different football educations. That variety can be a strength. It can also make building one clear identity difficult.`,
      sections: [
        {
          heading: `Plenty of players, but what kind of team?`,
          paragraphs: [
            `Nigeria rarely lacks names supporters can get excited about. The harder question is how those players fit together. Does the team press high or sit deeper? Does it dominate possession or attack quickly? Who controls tempo when a match becomes tense? These questions matter because international teams cannot rely on individual inspiration every week.`,
            `The run to the 2023 Africa Cup of Nations final, played in 2024, showed what organisation can achieve. Nigeria leaned heavily on defensive structure and collective resilience. The approach did not please everyone, but it carried the team deep into the competition and restored a sense that the Super Eagles could again challenge seriously for major honours.`
          ],
        },
        {
          heading: `The pressure never really changes`,
          paragraphs: [
            `Every new generation hears the same comparisons. Supporters remember 1980, 1994, 2013, Olympic success, famous players, and old matches as if they happened yesterday. That history creates pride, but it also means a modern squad is rarely judged only against the opponent in front of it.`,
            `The challenge is to turn available talent into continuity. Coaching stability, clear selection, strong administration, player trust, and a recognisable tactical plan can matter as much as discovering one more exciting forward. Nigeria does not need to prove that it can produce footballers. It needs to prove that it can consistently build a team around them.`
          ],
        },
      ],
      close: `The next great Super Eagles era will not be created by nostalgia. It will come from players and coaches building something supporters recognise as their own. The talent is there. The pressure is familiar. What remains is the difficult part: turning possibility into identity, and identity into results.`,
    }),
  ],

  [
    'music-roots',
    'channel-naija-music',
    'Before Afrobeats: Highlife, Palm-Wine, and the Sound of Independence',
    'Music',
    channelArticle({
      intro: `Long before Afrobeats became a global label, Nigerian popular music was already restless. Musicians were mixing local rhythms with guitars, brass bands, dance-hall energy, radio culture, urban nightlife, and influences arriving from across West Africa and beyond. The sound kept changing because the country around it kept changing too.`,
      sections: [
        {
          heading: `When modern Nigerian pop was still being invented`,
          paragraphs: [
            `Highlife developed different personalities across Nigeria. In some places it leaned toward big-band sophistication. Elsewhere, guitar-led styles and regional languages gave it a more intimate character. Palm-wine music grew from social spaces where storytelling, guitar, humour, and relaxed performance could hold an audience without needing a massive stage.`,
            `These sounds became part of the atmosphere around changing cities and the independence era. Musicians were not simply copying imported forms. They were translating modern life into familiar rhythms, local languages, fashion, and performance styles. A dance floor could become a place where a new urban identity was being tested in public.`
          ],
        },
        {
          heading: `Why the roots still matter`,
          paragraphs: [
            `Modern listeners sometimes talk about Nigerian music as though the story begins with streaming platforms and international collaborations. That erases decades of experimentation. Today's confidence rests partly on earlier musicians proving that Nigerian stories, accents, rhythms, instruments, and audiences were enough to build a popular culture around.`,
            `The technology changed from live bands and vinyl to cassettes, CDs, downloads, and streaming, but the basic instinct stayed familiar: take what is around you, mix it with what you love, and make something people want to move to.`
          ],
        },
      ],
      close: `Afrobeats did not appear from nowhere. It inherited a country that had already spent generations turning social life into sound. Highlife and palm-wine traditions are not just old chapters. They are part of the foundation beneath the music Nigeria exports to the world today.`,
    }),
  ],
  [
    'music-fela',
    'channel-naija-music',
    'Fela, Afrobeat, and Music as Political Confrontation',
    'Music',
    channelArticle({
      intro: `Fela Anikulapo Kuti did not make background music. His songs demanded attention, and they often demanded patience too. Long arrangements could build slowly, layering drums, bass, guitar, horns, chants, and repetition until the groove became almost impossible to separate from the argument inside it.`,
      sections: [
        {
          heading: `A sound built to confront`,
          paragraphs: [
            `Afrobeat fused jazz, funk, highlife, percussion, call-and-response, and extended arrangements into something with its own identity. Africa 70 and later Egypt 80 created dense musical worlds where rhythm did not sit behind the message. Rhythm carried the message. The music gave Fela room to speak, mock, accuse, provoke, and turn political frustration into performance.`,
            `His lyrics attacked military power, corruption, inequality, and what he described as colonial mentality. Pidgin English helped the message travel across linguistic boundaries. A listener did not need to belong to one ethnic group to understand the anger, humour, or challenge.`
          ],
        },
        {
          heading: `A legacy that is bigger than celebration`,
          paragraphs: [
            `Fela's influence is enormous, but his legacy is not simple. People celebrate the music, the courage, the performance style, and the willingness to confront authority. At the same time, discussions about his personal life, relationships, politics, and behaviour continue. Treating him as either a flawless hero or only a controversial figure misses the complexity.`,
            `Musically, the impact is easier to hear. Afrobeat continues to influence bands, producers, protest music, jazz, funk, and contemporary African popular music. The sound remains attractive because it can make a listener dance while forcing them to think about what they are dancing to.`
          ],
        },
      ],
      close: `Fela's most lasting achievement may be that he made refusal audible. The music did not ask permission to be political, Nigerian, noisy, funny, repetitive, or confrontational. It built a world where the groove and the argument were inseparable, and musicians are still exploring that world decades later.`,
    }),
  ],
  [
    'music-juju-fuji',
    'channel-naija-music',
    'Jùjú and Fuji: How Yoruba Popular Music Filled the City',
    'Music',
    channelArticle({
      intro: `Before playlists were measured in three-minute singles, Yoruba parties could stretch for hours under the control of live bands. Jùjú and Fuji grew inside that social world, where praise, percussion, dancing, money spraying, rivalry, fashion, religion, humour, and status could all meet in the same performance.`,
      sections: [
        {
          heading: `Different sounds, shared social energy`,
          paragraphs: [
            `Jùjú developed through guitars, percussion, layered vocals, and increasingly sophisticated band arrangements. Artists such as King Sunny Adé and Ebenezer Obey expanded the sound and helped carry it to audiences far beyond its original social spaces. Their music could praise patrons, reflect spiritual themes, document public life, and still keep a dance floor moving.`,
            `Fuji developed with a different rhythmic force, drawing heavily on percussion, chant, vocal intensity, and the culture of long-form performance. Artists including Sikiru Ayinde Barrister and Kollington Ayinla helped define the genre's competitive energy and public presence. Fuji could be celebratory, argumentative, devotional, boastful, or sharply observant, sometimes in the same performance.`
          ],
        },
        {
          heading: `Music as a record of the city`,
          paragraphs: [
            `Both genres became archives of social life. Listen closely and you hear names, ambitions, rivalries, religious references, political commentary, neighbourhood pride, fashion, migration, and the changing economy. A song can function like a newspaper written in rhythm, especially when an artist is speaking directly to the audience in front of them.`,
            `Their long-form performance culture also challenges modern assumptions about attention spans. These songs were not designed only for passive listening. They belonged to events, journeys, parties, ceremonies, and relationships between performers and audiences.`
          ],
        },
      ],
      close: `Jùjú and Fuji matter because they show that Nigerian pop history did not begin when the world started paying attention. Yoruba popular music had already built star systems, fan loyalties, sonic innovation, and highly sophisticated performance cultures. The city had a soundtrack long before streaming gave it a global dashboard.`,
    }),
  ],
  [
    'music-hiphop',
    'channel-naija-music',
    'The Nigerian Hip-Hop and R&B Boom of the 2000s',
    'Music',
    channelArticle({
      intro: `The Nigerian music industry of the 2000s felt like a system discovering its own scale. Radio stations, music television, campus shows, CDs, street promotion, new labels, producers, and ambitious young artists created an environment where local music no longer had to feel like the alternative to imported pop. It could become the main event.`,
      sections: [
        {
          heading: `Local stars for a local audience`,
          paragraphs: [
            `Artists experimented with hip-hop, R&B, pop, pidgin, English, and Nigerian languages, often mixing influences without worrying too much about strict genre boundaries. Producers built beats that worked in clubs, cars, parties, and television countdowns. The sound was uneven and constantly changing, which was exactly what made the era exciting.`,
            `For young listeners, seeing Nigerian artists presented with stronger videos, branding, fashion, and media coverage mattered. A domestic star system was becoming visible. People could argue about favourite rappers, singers, producers, groups, and albums without automatically looking outside the country for the standard.`
          ],
        },
        {
          heading: `The bridge to the global era`,
          paragraphs: [
            `The industry still struggled with piracy, inconsistent distribution, limited infrastructure, and unstable business models. Yet the cultural momentum was difficult to stop. Artists learned how to build fan bases, perform across cities, work with brands, use radio strategically, and create records that travelled through parties and informal networks.`,
            `That generation helped prepare the ground for the streaming era. The technology would change, but the confidence had already arrived. Nigerian audiences had shown that they would support home-grown music when the sound, image, and distribution matched their ambition.`
          ],
        },
      ],
      close: `The 2000s were messy, inventive, competitive, and foundational. They created the bridge between older popular traditions and the globally connected industry that followed. The biggest legacy may be psychological: Nigerian pop stopped behaving like it needed permission to take itself seriously.`,
    }),
  ],
  [
    'music-afrobeats',
    'channel-naija-music',
    'How Afrobeats Became a Global Pop Language',
    'Music',
    channelArticle({
      intro: `Afrobeats became one of the world's most visible pop movements without ever becoming one single sound. That is important. The label covers a wide range of contemporary West African pop styles, and Nigerian artists have repeatedly stretched it by borrowing from R&B, hip-hop, highlife, dancehall, amapiano, electronic music, street-pop, and older local traditions.`,
      sections: [
        {
          heading: `The breakthrough was not one moment`,
          paragraphs: [
            `Global success arrived in waves. Diaspora communities carried music into clubs and parties abroad. Digital platforms made discovery easier. Collaborations connected audiences. Touring turned online attention into physical crowds. International charts and arena shows made the scale impossible to ignore, but the groundwork had been built over years by artists, producers, DJs, promoters, labels, dancers, and fans.`,
            `The internet also changed the speed of movement. A sound from Lagos could travel across continents in days. A dance, slang phrase, producer tag, or chorus could become part of global pop culture before older industry structures fully understood what was happening.`
          ],
        },
        {
          heading: `Success creates new arguments`,
          paragraphs: [
            `Global attention brought opportunity, but it also created debates about naming, ownership, credit, and which artists or sounds receive international visibility. "Afrobeats" can be useful as a broad label, but it can also flatten differences between genres, regions, and creative traditions if people treat everything as the same thing.`,
            `The healthiest future is probably not one where artists chase a single formula that worked before. Nigerian music has always grown through experimentation. The moment everyone copies the same beat, melody, or image, the culture begins to lose the unpredictability that made people notice it in the first place.`
          ],
        },
      ],
      close: `Afrobeats became global because Nigerian music learned how to travel without completely giving up its local confidence. The next chapter will depend on whether artists keep expanding the language rather than shrinking themselves to fit the expectations of a global market.`,
    }),
  ],

  [
    'politics-independence',
    'channel-politics-ng',
    'From Independence to Republic: Building Nigeria’s First Political Order',
    'Politics',
    channelArticle({
      intro: `Independence in 1960 did not hand Nigeria a finished political system. It handed Nigerians control of a country already carrying regional competition, colonial institutions, ethnic diversity, constitutional compromises, and major arguments about representation. Becoming independent was a historic achievement. Building a political order that everyone trusted was a different challenge.`,
      sections: [
        {
          heading: `A federation trying to balance many interests`,
          paragraphs: [
            `Nigeria inherited a federal structure in which powerful regions played major political roles. Parties were strongly rooted in different parts of the country, and debates over representation, revenue, censuses, elections, and minority concerns quickly became central. Regional governments also pursued ambitious programmes, showing that political competition could produce development as well as tension.`,
            `The country became a republic in 1963, but constitutional change did not remove the deeper disagreements underneath the system. Political leaders were trying to manage national unity while defending regional interests, party power, and different visions of how the federation should work.`
          ],
        },
        {
          heading: `Why the First Republic still matters`,
          paragraphs: [
            `Disputes over elections, censuses, resources, and political legitimacy deepened mistrust. In January 1966, a military coup ended the civilian order. The collapse was not caused by one issue alone. It came from a wider crisis in which institutions were unable to contain growing suspicion and conflict.`,
            `Many questions from that period remain familiar today: how should revenue be shared? How should minorities be protected? How much power should states have? What makes an election credible? How can institutions earn trust beyond the party controlling them?`
          ],
        },
      ],
      close: `The First Republic should not be remembered only as the political order that failed. It was also Nigeria's first major attempt to govern itself after colonial rule. Its achievements and failures still offer useful lessons about federalism, representation, political competition, and the danger of allowing institutional distrust to become normal.`,
    }),
  ],
  [
    'politics-military',
    'channel-politics-ng',
    'Military Rule and the Long Struggle for Civil Government',
    'Politics',
    channelArticle({
      intro: `For much of the period between 1966 and 1999, Nigeria was governed by military regimes. Coups were often presented as temporary solutions to civilian failure, corruption, or instability. In practice, military rule concentrated authority and repeatedly interrupted the development of democratic institutions.`,
      sections: [
        {
          heading: `Power without normal democratic checks`,
          paragraphs: [
            `Military governments ruled through a structure very different from elected civilian government. Political parties could be banned, constitutions suspended, and decision-making concentrated around military leadership. Different regimes varied in style and policy, but the basic problem remained the same: citizens had limited ability to remove leaders through ordinary elections.`,
            `The era included civil war, oil booms, economic crises, state creation, structural adjustment, repression, and several promised transitions back to civilian rule. Some governments introduced major policies or infrastructure, while others became associated with severe human-rights abuses and political restrictions. A serious history has to hold both policy outcomes and the absence of democratic accountability in view.`
          ],
        },
        {
          heading: `Resistance did not disappear`,
          paragraphs: [
            `Journalists, lawyers, students, labour organisations, artists, professional groups, civil-society organisations, and pro-democracy activists challenged military authority at different moments. The risks could be high. Publications were restricted, protests were confronted, and political opponents could face detention or worse.`,
            `The return to civilian government in 1999 therefore mattered deeply. Still, democracy could not automatically erase habits created by decades of centralised rule. Institutions, political culture, security agencies, and public expectations had all been shaped by the military era.`
          ],
        },
      ],
      close: `Understanding modern Nigerian politics requires remembering how long military rule lasted and how deeply it affected public institutions. The transition of 1999 was a beginning, not a magic reset. Democratic government had to rebuild habits of accountability in a country where interruption had become part of political life.`,
    }),
  ],
  [
    'politics-fourth-republic',
    'channel-politics-ng',
    'The Fourth Republic: What Changed After 1999?',
    'Politics',
    channelArticle({
      intro: `Since 1999, Nigeria has experienced its longest uninterrupted period of civilian rule. That fact is significant on its own. A generation has grown up knowing elections, legislatures, political parties, courts, governors, civil-society groups, and a noisy media environment as permanent features of public life rather than temporary pauses between coups.`,
      sections: [
        {
          heading: `What has genuinely changed`,
          paragraphs: [
            `Power has changed hands between parties at the federal level. Governors have become powerful political actors. Courts regularly decide major disputes. Elections are deeply contested, but they are also the recognised route to public office. Media and civil-society organisations operate in a political environment where criticism is part of everyday national conversation.`,
            `These changes matter because democratic systems strengthen partly through repetition. Institutions learn, parties adapt, voters develop expectations, and peaceful transfers of authority become less extraordinary. Longevity does not automatically produce quality, but it creates space for democratic habits to deepen.`
          ],
        },
        {
          heading: `The frustrations are real too`,
          paragraphs: [
            `Insecurity, corruption, weak public services, unemployment, economic pressure, electoral disputes, and distrust continue to shape how many Nigerians judge the Fourth Republic. A country can hold elections regularly and still leave citizens feeling that government is distant or ineffective.`,
            `That is why democracy should be measured by more than election dates. The quality of courts, legislatures, public finance, local government, policing, media freedom, service delivery, and citizens' ability to organise all matter. Democracy becomes meaningful when institutions can turn public authority into public value.`
          ],
        },
      ],
      close: `The Fourth Republic is neither a finished success story nor proof that democratic government has failed. It is an ongoing political system with real achievements and serious weaknesses. The central question is no longer simply whether civilian rule can survive, but whether it can become more trustworthy, effective, and accountable.`,
    }),
  ],
  [
    'politics-federalism',
    'channel-politics-ng',
    'Why Federalism Is at the Centre of Nigerian Politics',
    'Politics',
    channelArticle({
      intro: `Sooner or later, many Nigerian political arguments become arguments about federalism. Restructuring, state police, local-government autonomy, resource control, revenue allocation, state creation, and regional power may sound like separate debates, but they all circle the same question: who should have the authority to decide what?`,
      sections: [
        {
          heading: `Power, money, and responsibility`,
          paragraphs: [
            `Nigeria's federal system divides authority across federal, state, and local levels, but that division is not always neat. Revenue is especially important because many governments depend heavily on centrally collected funds. Whoever controls money often controls what can actually be implemented, regardless of what constitutional language suggests.`,
            `Supporters of greater decentralisation often argue that governments closer to citizens should control more responsibilities and resources. Critics may worry about weak local institutions, inequality between states, abuse by powerful regional actors, or the possibility that decentralisation simply moves corruption closer to home. Both concerns deserve serious answers.`
          ],
        },
        {
          heading: `Why slogans are not enough`,
          paragraphs: [
            `Calls for restructuring can mean very different things to different people. One person may mean state police. Another may mean revenue control. Another may want stronger local government, fewer federal responsibilities, or a different constitutional arrangement. Treating all of these as one idea hides the difficult trade-offs.`,
            `There is no neutral redesign of a federation. Every change creates new responsibilities, winners, risks, and costs. Serious reform therefore requires details: who pays, who regulates, who is accountable, what happens when a state fails, and how minority rights are protected within smaller units.`
          ],
        },
      ],
      close: `Federalism stays at the centre of Nigerian politics because it is really a debate about how a very diverse country shares power. The useful question is not whether restructuring sounds attractive. It is what specific structure would work better, for whom, and under what safeguards.`,
    }),
  ],
  [
    'politics-citizenship',
    'channel-politics-ng',
    'Citizenship Beyond Election Day',
    'Politics',
    channelArticle({
      intro: `Election day gets the photographs, the queues, the inked fingers, the speeches, and the tension. But democracy does not disappear when polling units close. Citizenship continues in the long stretch between elections, when budgets are passed, contracts are awarded, laws are debated, services fail or improve, and public officials make decisions with less attention on them.`,
      sections: [
        {
          heading: `Participation has many forms`,
          paragraphs: [
            `Voting is central, but it is not the only democratic tool available to citizens. Budget tracking, journalism, community organising, court action, public hearings, professional associations, labour activity, petitions, peaceful protest, research, and local advocacy can all influence government behaviour. Often, the less glamorous work produces the most durable results.`,
            `Effective civic participation also requires understanding what different offices can actually do. A councillor, governor, legislator, minister, and president do not control the same institutions. Demanding the right thing from the wrong office can create noise without accountability.`
          ],
        },
        {
          heading: `Digital politics changed the speed`,
          paragraphs: [
            `Social media lowered the cost of speaking publicly and made it easier for citizens to document events, organise quickly, and challenge official narratives. It also made misinformation, harassment, edited clips, false confidence, and outrage travel faster.`,
            `Visibility is useful, but visibility is not the same as organisation. A viral post can force attention for a day. Lasting civic work usually needs evidence, follow-up, clear demands, coalitions, and people willing to continue after the trend moves on.`
          ],
        },
      ],
      close: `A healthy political culture does not require everyone to agree. It requires citizens who can disagree without surrendering facts, institutions that can hear criticism, and public officials who understand that accountability does not expire after an election. Democracy is not one day of participation. It is a habit.`,
    }),
  ],

  [
    'endsars-origins',
    'channel-endsars',
    'Before October 2020: Why End SARS Had Been Building for Years',
    'Society',
    channelArticle({
      intro: `October 2020 did not come from nowhere. Long before the streets filled with protesters, Nigerians had been sharing allegations of extortion, arbitrary arrest, torture, harassment, and extrajudicial violence linked to the Special Anti-Robbery Squad and wider policing practices. For many young people, the issue was already personal before it became a national movement.`,
      sections: [
        {
          heading: `Years of complaints before the explosion`,
          paragraphs: [
            `Earlier online campaigns had already used the call to end SARS, while government announcements promised reform at different points. The problem was trust. Many people believed previous reforms had changed names or procedures without changing what happened during encounters with officers.`,
            `Each new testimony therefore landed inside an existing archive of anger. Videos, personal accounts, legal cases, reporting, and social-media posts created a sense that the problem was institutional rather than limited to a few individual officers. That distinction mattered because it changed the demand from punishing isolated abuses to changing the system that allowed abuse to continue.`
          ],
        },
        {
          heading: `Why 2020 became different`,
          paragraphs: [
            `By 2020, a generation comfortable with digital organisation could document, fund, amplify, and coordinate at extraordinary speed. A story from one city could become national conversation within hours. People who had never met could contribute food, legal support, medical help, transportation, security, information, or money.`,
            `The movement also connected experiences that many people had previously treated as private. A frightening police encounter could now be understood as part of a wider pattern shared by strangers across the country. That recognition helped turn individual frustration into collective action.`
          ],
        },
      ],
      close: `The End SARS protests became a national rupture because a long-standing grievance met a public that no longer believed quiet reform promises were enough. To understand October 2020, it is necessary to remember the years before it, when the anger was already accumulating one testimony at a time.`,
    }),
  ],
  [
    'endsars-organising',
    'channel-endsars',
    'How a Decentralised Protest Built National Solidarity',
    'Society',
    channelArticle({
      intro: `One of the most striking features of End SARS was what it did not have: a single recognised leader. There was no national headquarters issuing instructions to every protest location. Instead, volunteers, local groups, professional networks, and online communities coordinated different pieces of the movement at the same time.`,
      sections: [
        {
          heading: `A protest built like a network`,
          paragraphs: [
            `Food had to reach people. Lawyers had to respond to arrests. Medical teams needed supplies. Transport had to be arranged. Information had to be verified and shared. Funds had to be collected and accounted for. Security concerns had to be managed. None of this looked dramatic compared with a huge crowd, but without it the crowds would have been harder to sustain.`,
            `Digital tools helped people coordinate quickly, while transparent fundraising and public updates built trust among many supporters. Professional skills that usually lived inside offices were redirected toward protest logistics. Designers made information clear. Lawyers organised legal help. Medical workers treated injuries. Volunteers handled spreadsheets, food, communications, and transport.`
          ],
        },
        {
          heading: `The strength was also a weakness`,
          paragraphs: [
            `Decentralisation made it difficult for authorities to neutralise the movement by negotiating with, arresting, or discrediting one person. No individual could simply announce that everyone should go home. That protected the movement from being reduced to a personality.`,
            `But the same structure made formal negotiation difficult. Who had the authority to speak for everyone? Who could accept an offer? Who could promise that protesters in multiple cities would follow one decision? The movement's flexibility created power, but it also created a coordination problem once demands moved toward negotiation.`
          ],
        },
      ],
      close: `The organising remains historically important because it showed what young Nigerians could build quickly when trust, skills, transparent support, and a shared demand met one another. It was not perfectly coordinated, but it changed expectations about what decentralised civic action could look like.`,
    }),
  ],
  [
    'endsars-demands',
    'channel-endsars',
    'Beyond a Unit: What the Five-for-Five Demands Asked For',
    'Society',
    channelArticle({
      intro: `The phrase "End SARS" was easy to put on a placard, but the movement's demands went beyond the name of one police unit. The widely circulated Five-for-Five demands tried to connect immediate protest concerns with broader questions of justice, accountability, welfare, and institutional reform.`,
      sections: [
        {
          heading: `What protesters were actually asking for`,
          paragraphs: [
            `The demands included the release of arrested protesters, justice and compensation for victims of police brutality, independent investigation of misconduct, psychological evaluation and retraining of officers connected to the disbanded unit before redeployment, and better pay for police officers.`,
            `That combination is important. It recognised that reform is not only about punishment. Police welfare and professional conditions also affect institutional behaviour. At the same time, improving conditions cannot replace accountability when abuses occur. The demands tried to hold both ideas together.`
          ],
        },
        {
          heading: `Why a new name did not automatically rebuild trust`,
          paragraphs: [
            `When authorities announced changes to SARS and later introduced replacement arrangements, many protesters remained sceptical. The concern was that changing a unit's name would not matter if recruitment, oversight, discipline, training, incentives, and accountability remained weak.`,
            `Institutional trust is built through evidence. Citizens need to see complaints investigated, findings published, abusive conduct punished, victims recognised, and promised reforms implemented over time. One announcement cannot repair years of fear or suspicion.`
          ],
        },
      ],
      close: `The Five-for-Five demands mattered because they pushed the conversation beyond one acronym. The larger question was what professional, accountable policing should look like in a democratic society. That question remains bigger than any single unit, policy statement, or protest moment.`,
    }),
  ],
  [
    'endsars-memory',
    'channel-endsars',
    'Remembering Lekki and the Disputed Record of 20 October 2020',
    'Society',
    channelArticle({
      intro: `The events at the Lekki Toll Gate on 20 October 2020 remain among the most emotionally charged and disputed parts of the End SARS story. Protesters, journalists, authorities, investigators, witnesses, and institutions have presented accounts that do not align neatly. That makes careful documentation more important, not less.`,
      sections: [
        {
          heading: `Why the record requires care`,
          paragraphs: [
            `In politically charged events, people often want a simple sentence that settles everything. Historical evidence rarely behaves that neatly. Testimony, video, official statements, investigative findings, medical records, reporting, and later recollections can support some claims, contradict others, or leave gaps that remain contested.`,
            `Responsible remembrance means separating what can be verified from what is alleged, identifying who made a claim, noting where findings disagree, and resisting the temptation to strengthen a story simply because it supports a preferred political position. Accuracy is not disrespect. It is one of the ways public memory protects itself from manipulation.`
          ],
        },
        {
          heading: `Why memory itself became political`,
          paragraphs: [
            `Lekki became more than a location. It became a symbol inside arguments about state power, protest, accountability, media, evidence, and whose testimony counts. Anniversaries, court processes, reports, journalism, art, and public debate continue to revisit the events.`,
            `For people directly affected, this is not an abstract argument. Public disputes about evidence sit beside grief, trauma, fear, anger, and demands for recognition. A careful archive must therefore avoid both sensationalism and erasure.`
          ],
        },
      ],
      close: `Public memory matters because accountability depends on records that can survive political pressure and changing attention. Preserving evidence, identifying uncertainty, and distinguishing verified material from competing claims are not signs of weakness. They are part of taking history, and the people inside it, seriously.`,
    }),
  ],
  [
    'endsars-after',
    'channel-endsars',
    'After the Protests: Panels, Promises, and the Work Still Unfinished',
    'Society',
    channelArticle({
      intro: `When the crowds reduced and the hashtags stopped dominating every timeline, the End SARS story did not end. The next phase was quieter and slower: petitions, judicial panels, reports, compensation decisions, court cases, reform promises, and the difficult question of whether institutions would change after the public attention moved elsewhere.`,
      sections: [
        {
          heading: `The panels created a record`,
          paragraphs: [
            `Judicial panels of inquiry were established across a number of states to receive petitions and examine allegations of police abuse. Their work created official records that included testimony, documents, findings, recommendations, and in some cases compensation for petitioners.`,
            `That process mattered because many complaints that had lived only as personal stories or social-media posts entered a formal setting. Still, creating a record is not the same as implementing every recommendation. The impact of the panels depended on what governments and institutions did afterward.`
          ],
        },
        {
          heading: `Trust is measured after the announcement`,
          paragraphs: [
            `Implementation has varied, and many Nigerians remain dissatisfied with the pace and visibility of police reform. Everyday encounters between citizens and law-enforcement officers continue to shape whether people believe meaningful change has occurred.`,
            `The larger lesson is that reform is not an event. It is a sequence of policies, budgets, training systems, disciplinary decisions, court processes, oversight mechanisms, and public reporting. Progress can be real without being complete, and promises can sound impressive without producing measurable change.`
          ],
        },
      ],
      close: `The legacy of End SARS remains unsettled. It lives in policy debates, court cases, public memory, art, anniversaries, civic organising, and the continuing demand that security should not require citizens to surrender dignity. The protests ended, but the questions that produced them did not.`,
    }),
  ],

  [
    'election-2023-field',
    'channel-election-ng',
    'The 2023 Election and the End of a Familiar Two-Party Map',
    'Elections',
    channelArticle({
      intro: `Nigeria's 2023 presidential election disrupted a pattern many voters had grown used to. Instead of a contest that felt entirely dominated by two major political blocs, multiple candidates built strong regional support and made the national map more competitive and less predictable.`,
      sections: [
        {
          heading: `A more fragmented contest`,
          paragraphs: [
            `Economic conditions, insecurity, identity, party structures, candidate records, and the political energy of younger voters all shaped the campaign. Online enthusiasm was highly visible, but election day also reminded everyone that social media is not the same thing as nationwide electoral infrastructure.`,
            `Strong regional performances showed that the old political map could be challenged. At the same time, established party structures remained important because elections are won polling unit by polling unit. Agents, ward organisation, logistics, local networks, and the ability to protect votes still matter even in a digital political age.`
          ],
        },
        {
          heading: `Realignment is possible, but difficult`,
          paragraphs: [
            `The election suggested that Nigerian politics can realign when new coalitions, personalities, and voter frustrations meet. However, breaking an old pattern is not the same as building a durable national organisation.`,
            `Future challengers will need both enthusiasm and structure. A movement that dominates conversation but lacks presence across thousands of local communities can struggle to convert attention into votes. Established parties face the opposite challenge: strong machinery means little if voters stop trusting the people operating it.`
          ],
        },
      ],
      close: `The 2023 election did not erase Nigeria's older political networks, but it showed that they are not untouchable. The lasting question is whether future parties and candidates can combine genuine public energy with the patient local organisation required to compete nationally.`,
    }),
  ],
  [
    'election-2023-tech',
    'channel-election-ng',
    'BVAS, IReV, and the Trust Question in 2023',
    'Elections',
    channelArticle({
      intro: `Technology carried enormous expectations into Nigeria's 2023 elections. Many voters hoped digital systems would reduce familiar disputes, make manipulation harder, and allow the public to follow results more transparently. BVAS and the IReV portal became part of everyday political vocabulary before many people fully understood what each system was designed to do.`,
      sections: [
        {
          heading: `What the technology was supposed to support`,
          paragraphs: [
            `The Bimodal Voter Accreditation System supported voter accreditation, while the IReV portal was intended to improve public access to polling-unit result documents. These tools were never the entire election process, but they became symbols of a wider promise that technology could strengthen transparency.`,
            `That promise raised expectations. When uploads were delayed or disputed, especially around the presidential election, technical performance became a political issue. Supporters and critics interpreted the same failures through very different levels of trust in the electoral system.`
          ],
        },
        {
          heading: `Technology cannot carry trust alone`,
          paragraphs: [
            `A device can support accreditation. A portal can publish documents. Neither can replace clear procedures, trained officials, functioning logistics, transparent communication, credible collation, or accountability when rules are not followed.`,
            `The deeper lesson from 2023 is that election technology should be judged by what it actually does, not by magical expectations placed on it. Systems need testing, redundancy, clear explanation, documented failures, and public evidence that problems were addressed.`
          ],
        },
      ],
      close: `Trust grows when voters can understand the process from polling unit to final declaration and when institutions explain failures without pretending they did not happen. Election technology can strengthen that trust, but only when the surrounding human system is equally serious.`,
    }),
  ],
  [
    'election-2023-lessons',
    'channel-election-ng',
    'What the Official 2023 Record Can Teach Before the Next Vote',
    'Elections',
    channelArticle({
      intro: `Every major election produces competing memories. Supporters remember what confirms their side. Opponents remember what proves their criticism. The official record is messier than either version. It includes results, petitions, observer reports, turnout data, administrative reviews, court decisions, polling-unit experiences, and thousands of local stories that do not all point in one direction.`,
      sections: [
        {
          heading: `Review the process, not only the winner`,
          paragraphs: [
            `A useful election review asks several questions at once. What did the law require? What did the electoral commission promise? What happened at polling units? How did logistics perform? Which failures were isolated and which were widespread? How were disputes handled? What did courts decide, and what did observers document?`,
            `No single statistic can answer all of those questions. Turnout may tell one story. Upload delays may tell another. Regional voting patterns may reveal something different again. Serious analysis works by comparing evidence rather than choosing one convenient number and treating it as the whole election.`
          ],
        },
        {
          heading: `The goal is improvement, not permanent campaigning`,
          paragraphs: [
            `Reviewing 2023 should not become an endless replay of campaign loyalties. The practical value lies in identifying weaknesses that can be corrected before the next vote: recruitment, training, logistics, accessibility, security, communication, technology, collation, and public information.`,
            `It also means acknowledging improvements where they existed. Election systems get stronger when criticism is specific enough to produce a remedy and praise is specific enough to preserve what worked.`
          ],
        },
      ],
      close: `The point of an election record is not to make everyone agree about politics. It is to give citizens and institutions something firmer than memory to work with. The next election should begin with lessons from the last one, not with the same problems presented as surprises.`,
    }),
  ],
  [
    'election-2027-road',
    'channel-election-ng',
    'The Road to 2027 Has Already Begun',
    'Elections',
    channelArticle({
      intro: `A general election does not begin when campaign posters appear. By that point, many important decisions have already been made. Voter registration, party membership, internal primaries, candidate nomination, litigation, logistics, recruitment, technology testing, security planning, and civic education all shape what eventually happens on election day.`,
      sections: [
        {
          heading: `The quiet work before the rallies`,
          paragraphs: [
            `Political parties have to organise internally, select candidates, manage disputes, and build structures capable of operating across communities. Electoral officials have to plan materials, staff, technology, polling locations, and procedures. Civil-society organisations and journalists begin preparing voter education, observation, verification, and public-interest reporting.`,
            `Voters also have work to do before campaign season becomes loud. Registration status, polling information, identification requirements, and official notices matter more than viral rumours. Missing an administrative deadline can matter just as much as changing your mind about a candidate.`
          ],
        },
        {
          heading: `Timelines can change`,
          paragraphs: [
            `INEC formally released its timetable and schedule for the 2027 general elections in February 2026 and later revised parts of the schedule. That is exactly why voters should rely on current official notices rather than screenshots or old posts that continue circulating long after information changes.`,
            `Election planning is a moving process shaped by law, court decisions, logistics, and administrative updates. Following the process early makes it easier to distinguish real changes from campaign noise.`
          ],
        },
      ],
      close: `The most useful question about 2027 is not only who will run. It is whether parties, institutions, media, civil society, and citizens are doing the quieter work required for a credible election. By the time the rallies begin, much of the foundation will already be in place.`,
    }),
  ],
  [
    'election-2027-voters',
    'channel-election-ng',
    'A Practical 2027 Voter Checklist Without the Campaign Noise',
    'Elections',
    channelArticle({
      intro: `Election season can become a wall of slogans, clips, insults, predictions, and confident people telling you exactly what will happen. A useful voter needs something simpler: verified information, a clear understanding of the offices being contested, and enough patience to compare promises with what those offices can actually deliver.`,
      sections: [
        {
          heading: `Start with the boring details`,
          paragraphs: [
            `Confirm your registration through official channels. Know your polling location. Protect your voter information. Follow current notices from the electoral commission. Understand what documents or procedures apply to you. These details are not exciting, but they determine whether you can participate at all.`,
            `Avoid relying on screenshots with no date or source. Election timelines can change, court decisions can affect candidates, and polling information can be updated. A viral post is not more official because thousands of people shared it.`
          ],
        },
        {
          heading: `Judge candidates by the job they are seeking`,
          paragraphs: [
            `Compare records, teams, budgets, policy trade-offs, and the credibility of promises. A president, governor, legislator, and local official do not perform the same job. Ask whether a promise is actually within the power of the office being contested.`,
            `Also separate confidence from evidence. Campaigns are designed to persuade. Supporters highlight strengths and minimise weaknesses. A voter does not have to become cynical, but should become difficult to fool.`
          ],
        },
      ],
      close: `Participation should never require surrendering safety or dignity. Credible voting depends on peaceful access, secret ballots, accurate information, and citizens who understand both their rights and the limits of viral claims. The goal is not to know everything. It is to know enough to make your own decision.`,
    }),
  ],
  [
    'election-2027-watch',
    'channel-election-ng',
    'What Nigeria Election Watch Will Track Through 2027',
    'Elections',
    channelArticle({
      intro: `Election coverage can easily become one long argument about personalities. Nigeria Election Watch will take a different approach. The goal is to track the parts of the process that determine whether voters can understand, trust, and participate in the election, not only who appears to be winning the loudest conversation online.`,
      sections: [
        {
          heading: `What we will follow`,
          paragraphs: [
            `We will track official timelines, voter-registration information, party primaries, candidate lists, court decisions, campaign-finance questions, debates, security, accessibility, technology, logistics, and election-day administration. When dates or procedures change, updates should clearly identify what changed and where the new information came from.`,
            `We will also distinguish confirmed information from party claims, campaign statements, analysis, and rumours. Those categories are not the same. A useful election channel should help readers see the difference without forcing them to decode the writer's political preference first.`
          ],
        },
        {
          heading: `What we will not turn this into`,
          paragraphs: [
            `Horserace coverage has a place, but it should not swallow everything else. Polling, endorsements, rallies, and campaign momentum matter. So do manifestos, budgets, institutional powers, election law, accessibility, security, and whether the process works in ordinary communities away from national cameras.`,
            `Corrections should be visible. Sources should be named where possible. When information is uncertain, uncertainty should be stated rather than hidden behind confident language. Trust is easier to lose than to rebuild.`
          ],
        },
      ],
      close: `Following an election should make a voter more capable, not simply more anxious. The aim of Nigeria Election Watch is to create a record people can actually use before, during, and after ballots are cast.`,
    }),
  ],
];
